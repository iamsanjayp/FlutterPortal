import pool from "../config/db.js";
import path from "path";
import fs from "fs";
import {
  runFlutterCode,
  runFlutterCustom,
  runFlutterUI,
} from "../execution/flutter/runFlutter.js";
import { getLevelConfig, getNextLevel, setCurrentLevel } from "../utils/level.js";

/**
 * Execute Flutter code for a given problem in a test session
 */
export async function executeTest(req, res) {
  try {
    const { sessionId, problemId, code } = req.body;

    if (!sessionId || !problemId || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [[sessionRow]] = await pool.query(
      "SELECT level FROM test_sessions WHERE id = ?",
      [sessionId]
    );
    const level = sessionRow?.level || "1A";
    const { assessmentType } = await getLevelConfig(level);
    if (assessmentType === "UI_COMPARE") {
      return res.status(400).json({ error: "Test case execution is not enabled for UI levels" });
    }

    // Fetch test cases
    const [testCases] = await pool.query(
      `
      SELECT id, input, expected_output
      FROM test_cases
      WHERE problem_id = ?
      ORDER BY order_no
      `,
      [problemId]
    );

    if (!testCases.length) {
      return res.status(404).json({ error: "No test cases found" });
    }

    const [[problemRow]] = await pool.query(
      `
      SELECT starter_code
      FROM problems
      WHERE id = ?
      `,
      [problemId]
    );

    const starterCode = problemRow?.starter_code || "";
    const functionName =
      extractFunctionName(starterCode) || extractFunctionName(code);
    if (!functionName) {
      return res.status(400).json({ error: "Unable to detect function name" });
    }

    const paramTypes = extractParamTypes(starterCode);
    const returnType = extractReturnType(starterCode);

    const preparedCases = testCases.map(tc => {
      const args = parseTestCaseInput(tc.input, paramTypes);
      const expected = parseTestCaseValue(tc.expected_output, returnType);

      return {
        id: tc.id,
        dartArgs: args.map(toDartLiteral),
        dartExpected: toDartLiteral(expected),
      };
    });

    // Execute Flutter code
    const executionResult = await runFlutterCode(code, {
      functionName,
      cases: preparedCases,
    });
    const rawTests = Array.isArray(executionResult.tests)
      ? executionResult.tests
      : [];

    const useFullFailFallback = rawTests.length !== preparedCases.length;

    const effectiveTests = useFullFailFallback
      ? preparedCases.map(tc => ({
        name: `TC_${tc.id}`,
        status: "FAIL",
        testCaseId: tc.id,
      }))
      : rawTests.length
        ? rawTests
        : preparedCases.map(tc => ({
          name: `TC_${tc.id}`,
          status: "FAIL",
          testCaseId: tc.id,
        }));

    const mappedTests = effectiveTests.map((t, index) => {
      const fallbackId = preparedCases[index]?.id ?? null;
      const resolvedId = t.testCaseId ?? fallbackId;
      const normalizedId = Number.isFinite(Number(resolvedId))
        ? Number(resolvedId)
        : null;

      return {
        ...t,
        testCaseId: normalizedId,
      };
    });

    const persistedTests = mappedTests.filter(
      t => Number.isFinite(t.testCaseId)
    );

    // Persist results
    for (const t of persistedTests) {
      await pool.query(
        `
        INSERT INTO test_case_results
        (test_session_id, problem_id, test_case_id, status, output)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          sessionId,
          problemId,
          t.testCaseId,
          t.status,
          t.output || null,
        ]
      );
    }

    const sessionStatus = await computeSessionStatus(sessionId);

    const overallStatus = mappedTests.length
      ? mappedTests.every(t => t.status === "PASS")
        ? "PASS"
        : "FAIL"
      : "FAIL";

    await pool.query(
      `
      INSERT INTO test_session_submissions
      (test_session_id, user_id, problem_id, code, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [sessionId, req.user.id, problemId, code, overallStatus]
    );

    res.json({
      status: overallStatus,
      tests: mappedTests,
      executionTimeMs: executionResult.executionTimeMs,
      sessionStatus,
      debugOutput: useFullFailFallback ? executionResult.rawOutput : undefined,
      debugTestFile: useFullFailFallback
        ? executionResult.testFileContent
        : undefined,
    });
  } catch (err) {
    console.error("Execution error:", err);
    res.status(500).json({ error: "Execution failed" });
  }
}

export async function executeCustom(req, res) {
  try {
    const { code, customInput } = req.body;

    if (!code || customInput === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const functionName = extractFunctionName(code);
    if (!functionName) {
      return res.status(400).json({ error: "Unable to detect function name" });
    }

    const paramTypes = extractParamTypes(code);
    const args = parseCustomInputWithTypes(customInput, paramTypes);
    const dartArgs = args.map(toDartLiteral);

    const executionResult = await runFlutterCustom(code, {
      functionName,
      dartArgs,
    });

    res.json({
      status: executionResult.status,
      executionTimeMs: executionResult.executionTimeMs,
      output: executionResult.customOutput ?? "",
    });
  } catch (err) {
    console.error("Custom execution error:", err);
    res.status(500).json({ error: "Custom execution failed" });
  }
}

export async function executeUiPreview(req, res) {
  try {
    const { sessionId, problemId, code } = req.body;

    if (!sessionId || !problemId || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [[sessionRow]] = await pool.query(
      "SELECT level FROM test_sessions WHERE id = ?",
      [sessionId]
    );
    const level = sessionRow?.level || "1A";
    const { assessmentType } = await getLevelConfig(level);
    if (assessmentType !== "UI_COMPARE") {
      return res.status(400).json({ error: "UI preview is only available for UI levels" });
    }

    if (!/\bWidget\s+buildUI\s*\(/.test(code)) {
      return res.status(400).json({
        error: "UI code must define Widget buildUI()",
      });
    }

    // Fetch resource URLs for this problem
    const [[previewProblemRow]] = await pool.query(
      "SELECT resource_urls FROM problems WHERE id = ?",
      [problemId]
    );
    let previewResourceUrls = [];
    if (previewProblemRow?.resource_urls) {
      try { previewResourceUrls = JSON.parse(previewProblemRow.resource_urls); } catch { }
    }

    const runResult = await runFlutterUI(code, Array.isArray(previewResourceUrls) ? previewResourceUrls : []);
    if (runResult.status !== "OK" || !runResult.previewBuffer) {
      const detail = runResult?.rawOutput
        ? runResult.rawOutput.slice(-1200)
        : "";
      console.error("UI preview failed:", detail);
      return res.status(500).json({
        error: "Failed to render UI preview",
        detail,
      });
    }

    const previewsDir = path.resolve(process.cwd(), "uploads", "ui_previews");
    fs.mkdirSync(previewsDir, { recursive: true });
    const filename = `preview-${sessionId}-${problemId}-${Date.now()}.png`;
    const destPath = path.join(previewsDir, filename);
    fs.writeFileSync(destPath, runResult.previewBuffer);

    const previewUrl = `/uploads/ui_previews/${filename}`;
    res.json({ previewUrl, executionTimeMs: runResult.executionTimeMs });
  } catch (err) {
    console.error("UI preview error:", err);
    res.status(500).json({ error: "Failed to render UI preview" });
  }
}

export async function executeUiSubmit(req, res) {
  try {
    const { sessionId, problemId, code } = req.body;

    if (!sessionId || !problemId || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [[sessionRow]] = await pool.query(
      "SELECT level FROM test_sessions WHERE id = ?",
      [sessionId]
    );
    const level = sessionRow?.level || "1A";
    const { assessmentType, passThreshold } = await getLevelConfig(level);
    if (assessmentType !== "UI_COMPARE") {
      return res.status(400).json({ error: "UI submit is only available for UI levels" });
    }

    if (!/\bWidget\s+buildUI\s*\(/.test(code)) {
      return res.status(400).json({
        error: "UI code must define Widget buildUI()",
      });
    }

    const [[problemRow]] = await pool.query(
      "SELECT ui_required_widgets, resource_urls FROM problems WHERE id = ?",
      [problemId]
    );

    const uiRequirements = parseUiRequirements(problemRow?.ui_required_widgets);
    const codeScore = uiRequirements
      ? scoreUiCodeCombined(code, uiRequirements)
      : scoreUiCode(code);

    let submitResourceUrls = [];
    if (problemRow?.resource_urls) {
      try { submitResourceUrls = JSON.parse(problemRow.resource_urls); } catch { }
    }

    const runResult = await runFlutterUI(code, Array.isArray(submitResourceUrls) ? submitResourceUrls : []);
    if (runResult.status !== "OK" || !runResult.previewBuffer) {
      const detail = runResult?.rawOutput
        ? runResult.rawOutput.slice(-1200)
        : "";
      console.error("UI submit failed:", detail);
      return res.status(500).json({
        error: "Failed to render UI preview",
        detail,
      });
    }

    const previewsDir = path.resolve(process.cwd(), "uploads", "ui_previews");
    fs.mkdirSync(previewsDir, { recursive: true });
    const filename = `submit-${sessionId}-${problemId}-${Date.now()}.png`;
    const destPath = path.join(previewsDir, filename);
    fs.writeFileSync(destPath, runResult.previewBuffer);
    const previewUrl = `/uploads/ui_previews/${filename}`;

    const score = codeScore.score;
    const status = "AWAITING_MANUAL";

    await pool.query(
      `
      INSERT INTO test_session_submissions
      (test_session_id, user_id, problem_id, code, status, preview_image_url, score, match_percent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [sessionId, req.user.id, problemId, code, status, previewUrl, score, score]
    );
    res.json({
      status,
      score,
      matchPercent: score,
      scoreDetails: codeScore,
      previewUrl,
    });
  } catch (err) {
    console.error("UI submit error:", err);
    res.status(500).json({ error: "Failed to submit UI" });
  }
}

function scoreUiCode(code) {
  const required = [
    { key: "buildUI", re: /\bWidget\s+buildUI\s*\(/ },
    { key: "scaffold", re: /\bScaffold\b/ },
    { key: "appBar", re: /\bAppBar\b/ },
    { key: "text", re: /\bText\s*\(/ },
    { key: "icon", re: /\bIcon\s*\(/ },
    { key: "layout", re: /\bColumn\b|\bListView\b|\bListView\.separated\b/ },
  ];

  const optional = [
    { key: "listItem", re: /\bListTile\b|\bRow\b/ },
    { key: "circleAvatar", re: /\bCircleAvatar\b/ },
    { key: "bottomNav", re: /\bBottomNavigationBar\b/ },
    { key: "textField", re: /\bTextField\b|\bTextFormField\b/ },
    { key: "button", re: /\bElevatedButton\b|\bFilledButton\b|\bTextButton\b|\bMaterialButton\b/ },
    { key: "gradient", re: /\bLinearGradient\b|\bRadialGradient\b/ },
    { key: "titleText", re: /Profile And Settings|Welcome Back!|PCDP App/ },
    { key: "labelText", re: /Home|Personal Information|Notification Settings|Customize App Appearance|Help And Support|Log in|Your Email|Your Password/ },
  ];

  const matchedRequired = required.filter(c => c.re.test(code));
  const matchedOptional = optional.filter(c => c.re.test(code));

  const requiredScore = required.length
    ? matchedRequired.length / required.length
    : 1;
  const optionalScore = optional.length
    ? matchedOptional.length / optional.length
    : 1;

  const score = Math.round(requiredScore * 70 + optionalScore * 30);

  return {
    score,
    requiredTotal: required.length,
    optionalTotal: optional.length,
    matchedRequired: matchedRequired.map(m => m.key),
    matchedOptional: matchedOptional.map(m => m.key),
  };
}

function scoreUiCodeCombined(code, requirements) {
  const generic = scoreUiCode(code);
  const required = scoreUiCodeWithRequirements(code, requirements);

  const combinedScore = Math.round(generic.score * 0.5 + required.score * 0.5);

  return {
    score: combinedScore,
    weights: { generic: 0.5, required: 0.5 },
    generic,
    required,
  };
}

function parseUiRequirements(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const cleaned = raw.map(v => String(v || "").trim()).filter(Boolean);
    return cleaned.length ? cleaned : null;
  }
  if (typeof raw !== "string") return null;

  const text = raw.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.map(v => String(v || "").trim()).filter(Boolean);
      return cleaned.length ? cleaned : null;
    }
  } catch { }

  const cleaned = text
    .split(/\r?\n|,/)
    .map(v => v.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : null;
}

function scoreUiCodeWithRequirements(code, requirements) {
  const matched = [];
  for (const widget of requirements) {
    const escaped = widget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`);
    if (re.test(code)) matched.push(widget);
  }

  const total = requirements.length || 1;
  const score = Math.round((matched.length / total) * 100);

  return {
    score,
    requiredTotal: total,
    matchedRequired: matched,
  };
}

async function recomputeSessionStatusFromSubmissions(sessionId) {
  const [[session]] = await pool.query(
    "SELECT id, user_id, level FROM test_sessions WHERE id = ?",
    [sessionId]
  );

  if (!session) {
    return null;
  }

  const [[totalRow]] = await pool.query(
    "SELECT COUNT(*) AS totalCount FROM test_session_questions WHERE test_session_id = ?",
    [sessionId]
  );
  const totalCount = totalRow?.totalCount || 0;

  const [latestRows] = await pool.query(
    `
    SELECT problem_id, status
    FROM (
      SELECT problem_id, status,
             ROW_NUMBER() OVER (PARTITION BY problem_id ORDER BY updated_at DESC, id DESC) AS rn
      FROM test_session_submissions
      WHERE test_session_id = ?
    ) ranked
    WHERE rn = 1
    `,
    [sessionId]
  );

  const passCount = latestRows.filter(r => r.status === "PASS").length;
  const failCount = latestRows.filter(r => r.status === "FAIL").length;

  let status = "IN_PROGRESS";
  let levelCleared = 0;

  if (totalCount > 0 && passCount === totalCount) {
    status = "PASS";
    levelCleared = 1;
  } else if (failCount > 0) {
    status = "FAIL";
    levelCleared = 0;
  }

  await pool.query(
    `
    UPDATE test_sessions
    SET status = ?, level_cleared = ?, ended_at = CASE WHEN ? = 'IN_PROGRESS' THEN NULL ELSE COALESCE(ended_at, NOW()) END
    WHERE id = ?
    `,
    [status, levelCleared, status, sessionId]
  );

  if (status === "PASS" && levelCleared) {
    const nextLevel = getNextLevel(session.level);
    await setCurrentLevel(session.user_id, nextLevel);
  } else if (status !== "PASS") {
    await setCurrentLevel(session.user_id, session.level);
  }

  return { status, levelCleared };
}

async function computeSessionStatus(sessionId) {
  const [[totalRow]] = await pool.query(
    `
    SELECT COUNT(*) AS totalCount
    FROM test_session_questions tsq
    JOIN test_cases tc ON tc.problem_id = tsq.problem_id
    WHERE tsq.test_session_id = ?
    `,
    [sessionId]
  );

  const totalCount = totalRow?.totalCount || 0;
  if (!totalCount) return "INCOMPLETE";

  const [latestRows] = await pool.query(
    `
    SELECT t.test_case_id, t.status
    FROM test_case_results t
    JOIN (
      SELECT test_case_id, MAX(id) AS max_id
      FROM test_case_results
      WHERE test_session_id = ?
      GROUP BY test_case_id
    ) latest ON latest.max_id = t.id
    `,
    [sessionId]
  );

  if (latestRows.length < totalCount) {
    return "INCOMPLETE";
  }

  const hasFail = latestRows.some(r => r.status === "FAIL");
  return hasFail ? "FAIL" : "PASS";
}

function extractFunctionName(code) {
  const match = code.match(/\b[A-Za-z_][A-Za-z0-9_]*\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  return match?.[1] || null;
}

function parseCustomInputWithTypes(customInput, paramTypes) {
  if (typeof customInput !== "string") {
    const args = normalizeArgs(customInput, paramTypes);
    return coerceArgsByTypes(args, paramTypes);
  }

  const trimmed = customInput.trim();
  if (!trimmed) return [""];

  try {
    const parsed = JSON.parse(trimmed);
    const args = normalizeArgs(parsed, paramTypes);
    return coerceArgsByTypes(args, paramTypes);
  } catch {
    return coerceArgsByTypes([customInput], paramTypes);
  }
}

function parseTestCaseInput(input, paramTypes) {
  return parseTestCaseInputWithTypes(input, paramTypes || []);
}

function parseTestCaseValue(value, returnType) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    return returnType?.startsWith("String") ? String(value) : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (returnType?.startsWith("String")) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function toDartLiteral(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(toDartLiteral).join(", ")}]`;
  }
  if (typeof value === "object") {
    return `{${Object.entries(value)
      .map(([key, val]) => `${JSON.stringify(key)}: ${toDartLiteral(val)}`)
      .join(", ")}}`;
  }

  return JSON.stringify(String(value));
}

function parseTestCaseInputWithTypes(input, paramTypes) {
  if (input === null || input === undefined) return [null];
  if (typeof input !== "string") {
    const args = normalizeArgs(input, paramTypes);
    return coerceArgsByTypes(args, paramTypes);
  }

  const trimmed = input.trim();
  if (!trimmed) return [""];

  try {
    const parsed = JSON.parse(trimmed);
    const args = normalizeArgs(parsed, paramTypes);
    return coerceArgsByTypes(args, paramTypes);
  } catch {
    return coerceArgsByTypes([input], paramTypes);
  }
}

function normalizeArgs(parsed, paramTypes) {
  if (paramTypes?.length === 1) {
    return [parsed];
  }
  return Array.isArray(parsed) ? parsed : [parsed];
}

function extractParamTypes(code) {
  const signatureMatch = code.match(/\(([^)]*)\)/);
  if (!signatureMatch) return [];

  const params = signatureMatch[1]
    .split(",")
    .map(param => param.trim())
    .filter(Boolean);

  return params.map(param => {
    const parts = param.split(/\s+/);
    return parts[0] || "";
  });
}

function extractReturnType(code) {
  const match = code.match(/\b([A-Za-z_][A-Za-z0-9_<>,?]*)\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/);
  return match?.[1] || "";
}

function coerceArgsByTypes(args, paramTypes) {
  if (!paramTypes?.length) return args;

  return args.map((arg, index) => {
    const type = paramTypes[index] || "";
    if (type.startsWith("String")) {
      return typeof arg === "string" ? arg : String(arg);
    }
    return arg;
  });
}
