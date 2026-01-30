import pool from "../config/db.js";
import {
  runFlutterCode,
  runFlutterCustom,
} from "../execution/flutter/runFlutter.js";

/**
 * Execute Flutter code for a given problem in a test session
 */
export async function executeTest(req, res) {
  try {
    const { sessionId, problemId, code } = req.body;

    if (!sessionId || !problemId || !code) {
      return res.status(400).json({ error: "Missing required fields" });
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
      (test_session_id, user_id, problem_id, code, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
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
