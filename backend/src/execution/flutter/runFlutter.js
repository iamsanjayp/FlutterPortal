import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BASE DIRECTORY = src/execution/flutter
const BASE_DIR = __dirname;
const TEMPLATE_DIR = path.join(BASE_DIR, "template");

export async function runFlutterCode(code, { functionName, cases }) {
  return new Promise((resolve) => {
    const runId = uuidv4();
    const workDir = path.join(BASE_DIR, "runs", runId);

    fs.mkdirSync(workDir, { recursive: true });
    fs.cpSync(TEMPLATE_DIR, workDir, { recursive: true });

    // Inject student code
    fs.writeFileSync(
      path.join(workDir, "lib", "solution.dart"),
      code
    );

    const testFileContent = buildOfficialTestFile(functionName, cases);
    fs.writeFileSync(
      path.join(workDir, "test", "solution_test.dart"),
      testFileContent
    );

    const dockerCmd = `docker run --rm -v "${workDir.replace(/\\/g, "/")}:/workspace" flutter-runner`;

    const startTime = Date.now();

    exec(dockerCmd, { timeout: 30000 }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      const output = stdout.toString() + "\n" + stderr.toString();

      try {
        const result = parseFlutterOutput(output, duration);
        resolve({
          ...result,
          rawOutput: output,
          testFileContent,
        });
      } catch (e) {
        resolve({
          status: "ERROR",
          message: "Failed to parse test output",
          rawOutput: output,
          testFileContent,
        });
      } finally {
        try {
          fs.rmSync(workDir, { recursive: true, force: true });
        } catch {
          setTimeout(() => {
            try {
              fs.rmSync(workDir, { recursive: true, force: true });
            } catch {
              // ignore cleanup errors on Windows file locks
            }
          }, 500);
        }
      }
    });
  });
}

export async function runFlutterCustom(code, { functionName, dartArgs }) {
  return new Promise((resolve) => {
    const runId = uuidv4();
    const workDir = path.join(BASE_DIR, "runs", runId);

    fs.mkdirSync(workDir, { recursive: true });
    fs.cpSync(TEMPLATE_DIR, workDir, { recursive: true });

    // Inject student code
    fs.writeFileSync(
      path.join(workDir, "lib", "solution.dart"),
      code
    );

    const testFileContent = buildCustomTestFile(functionName, dartArgs);
    fs.writeFileSync(
      path.join(workDir, "test", "solution_test.dart"),
      testFileContent
    );

    const dockerCmd = `docker run --rm -v "${workDir.replace(/\\/g, "/")}:/workspace" flutter-runner`;

    const startTime = Date.now();

    exec(dockerCmd, { timeout: 30000 }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      const output = stdout.toString() + "\n" + stderr.toString();

      try {
        const result = parseFlutterOutput(output, duration);
        resolve({
          ...result,
          rawOutput: output,
          testFileContent,
        });
      } catch (e) {
        resolve({
          status: "ERROR",
          message: "Failed to parse test output",
          rawOutput: output,
          testFileContent,
        });
      } finally {
        try {
          fs.rmSync(workDir, { recursive: true, force: true });
        } catch {
          setTimeout(() => {
            try {
              fs.rmSync(workDir, { recursive: true, force: true });
            } catch {
              // ignore cleanup errors on Windows file locks
            }
          }, 500);
        }
      }
    });
  });
}

function parseFlutterOutput(output, timeMs) {
  const lines = output.split("\n");

  const testNames = {};
  const tests = [];
  const printLines = [];

  let passed = 0;
  let failed = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;

    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }

    // Capture test names
    if (obj.type === "testStart" && obj.test) {
      testNames[obj.test.id] = obj.test.name;
    }

    if (obj.type === "print" && typeof obj.message === "string") {
      printLines.push(obj.message);
    }

    // Capture results
    if (obj.type === "testDone" && obj.testID) {
      const name = testNames[obj.testID] || `Test ${obj.testID}`;
      if (name.startsWith("loading /workspace/test/solution_test.dart")) {
        continue;
      }
      const testCaseId = extractTestCaseId(name);

      if (obj.result === "success") {
        passed++;
        tests.push({ name, status: "PASS", testCaseId });
      } else {
        failed++;
        tests.push({ name, status: "FAIL", testCaseId });
      }
    }
  }

  const customOutput = extractCustomOutput(printLines);

  return {
    status: failed === 0 ? "PASS" : "FAIL",
    passed,
    failed,
    total: passed + failed,
    tests,
    executionTimeMs: timeMs,
    customOutput,
  };
}

function buildCustomTestFile(functionName, dartArgs) {
  const args = Array.isArray(dartArgs) ? dartArgs.join(", ") : "";

  return `import 'package:test/test.dart';
import '../lib/solution.dart';

void main() {
  test('Custom input', () {
    final result = ${functionName}(${args});
    print('__CUSTOM_OUTPUT__' + result.toString());
  });
}
`;
}

function buildOfficialTestFile(functionName, cases = []) {
  const testBlocks = cases
    .map((testCase, index) => {
      const args = Array.isArray(testCase.dartArgs)
        ? testCase.dartArgs.join(", ")
        : "";
      const expected = testCase.dartExpected ?? "null";
      const testId = testCase.id ?? index + 1;

      return `  test('TC_${testId}', () {\n` +
        `    expect(${functionName}(${args}), equals(${expected}));\n` +
        `  });\n`;
    })
    .join("\n");

  return `import 'package:test/test.dart';\n` +
    `import '../lib/solution.dart';\n\n` +
    `void main() {\n${testBlocks}\n}\n`;
}

function extractTestCaseId(name) {
  const match = name.match(/TC_(\d+)/);
  if (!match) return null;
  return Number(match[1]);
}

function extractCustomOutput(printLines) {
  const prefix = "__CUSTOM_OUTPUT__";
  const line = printLines.find(message => message.includes(prefix));
  if (!line) return "";
  const index = line.indexOf(prefix);
  return line.slice(index + prefix.length).trim();
}

