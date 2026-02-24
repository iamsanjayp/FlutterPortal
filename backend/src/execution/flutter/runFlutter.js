import { exec } from "child_process";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BASE DIRECTORY = src/execution/flutter
const BASE_DIR = __dirname;
const TEMPLATE_DIR = path.join(BASE_DIR, "template");
const TEMPLATE_UI_DIR = path.join(BASE_DIR, "template_ui");

// Ensure student's UI code has the Flutter material import to avoid
// compile errors when they forget to include it. Only skip adding
// the import if `package:flutter/material.dart` is already present.
function ensureUiImport(src) {
  if (/import\s+['"]package:flutter\/material\.dart['"]/.test(src)) return src;
  return "import 'package:flutter/material.dart';\n" + src;
}

async function ensureTemplateFonts() {
  try {
    const fontsDir = path.join(TEMPLATE_UI_DIR, 'fonts');
    if (fs.existsSync(path.join(fontsDir, 'Roboto-Regular.ttf')) && fs.existsSync(path.join(fontsDir, 'Roboto-Bold.ttf'))) {
      return;
    }
    fs.mkdirSync(fontsDir, { recursive: true });
    const robotoBase = "https://raw.githubusercontent.com/google/fonts/main/apache/roboto";
    const downloads = [
      { url: `${robotoBase}/Roboto-Regular.ttf`, dest: path.join(fontsDir, 'Roboto-Regular.ttf') },
      { url: `${robotoBase}/Roboto-Bold.ttf`, dest: path.join(fontsDir, 'Roboto-Bold.ttf') },
    ];
    for (const d of downloads) {
      if (!fs.existsSync(d.dest)) {
        await new Promise((res, rej) => {
          const req = https.get(d.url, (response) => {
            if (response.statusCode !== 200) { rej(new Error(`HTTP ${response.statusCode}`)); return; }
            const ws = fs.createWriteStream(d.dest);
            response.pipe(ws);
            ws.on('finish', () => ws.close(res));
            ws.on('error', rej);
          });
          req.on('error', rej);
        });
        // small delay to ensure file system visibility on Windows
        await sleep(50);
        console.error(`Downloaded template font ${d.url}`);
      }
    }
  } catch (e) {
    console.error('Failed to ensure template fonts:', e && e.message ? e.message : e);
  }
}
export async function runFlutterCode(code, { functionName, cases }) {
  return new Promise(async (resolve) => {
    const runId = uuidv4();
    const workDir = path.join(BASE_DIR, "runs", runId);

    fs.mkdirSync(workDir, { recursive: true });
    fs.cpSync(TEMPLATE_DIR, workDir, { recursive: true });

    fs.writeFileSync(
      path.join(workDir, "lib", "solution.dart"),
      code
    );

    const testFileContent = buildOfficialTestFile(functionName, cases);
    fs.writeFileSync(
      path.join(workDir, "test", "solution_test.dart"),
      testFileContent
    );

    const useHostNetwork = process.env.FLUTTER_RUNNER_USE_HOST_NETWORK === "true";
    const networkArg = useHostNetwork ? "--network host" : "";
    const containerName = `code-test-${runId}`;
    const startTime = Date.now();
    let output = "";

    const execAsync = (cmd, opts = {}) =>
      new Promise((resolveCmd, rejectCmd) => {
        exec(cmd, opts, (err, stdout, stderr) => {
          if (err) {
            err.stdout = stdout;
            err.stderr = stderr;
            return rejectCmd(err);
          }
          return resolveCmd({ stdout, stderr });
        });
      });

    try {
      await execAsync(
        `docker run --name ${containerName} -d ${networkArg} -v flutter_pub_cache:/root/.pub-cache --entrypoint /bin/bash flutter-runner -c "sleep 300"`,
        { timeout: 30000 }
      );

      await execAsync(
        `docker exec ${containerName} /bin/bash -c "mkdir -p /workspace"`,
        { timeout: 30000 }
      );

      await execAsync(
        `docker cp "${workDir.replace(/\\/g, "/")}/." ${containerName}:/workspace`,
        { timeout: 30000 }
      );

      const runResult = await execAsync(
        `docker exec ${containerName} /bin/bash -c "rm -rf /workspace/.dart_tool /workspace/.packages /workspace/.flutter-plugins /workspace/.flutter-plugins-dependencies && cd /workspace && flutter pub get && flutter test --reporter json"`,
        { timeout: 300000 }
      );
      output = runResult.stdout.toString() + "\n" + runResult.stderr.toString();
    } catch (err) {
      const stdout = err.stdout ? err.stdout.toString() : "";
      const stderr = err.stderr ? err.stderr.toString() : "";
      output = `${stdout}\n${stderr}`.trim();
      if (err.message && !output.includes(err.message)) {
        output += `\n${err.message}`;
      }
    }

    const duration = Date.now() - startTime;

    try {
      const result = parseFlutterOutput(output, duration);
      resolve({
        ...result,
        rawOutput: output,
        testFileContent,
      });
    } catch {
      resolve({
        status: "ERROR",
        message: "Failed to parse test output",
        rawOutput: output,
        testFileContent,
      });
    } finally {
      try {
        exec(`docker rm -f ${containerName}`);
      } catch { }
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
}

export async function runFlutterUI(code, resourceUrls = []) {
  return new Promise(async (resolve) => {
    const runId = uuidv4();
    const workDir = path.join(BASE_DIR, "runs", runId);
    const uiTimeoutMs = Number(process.env.UI_TEST_TIMEOUT_MS || 120000);

    fs.mkdirSync(workDir, { recursive: true });
    await ensureTemplateFonts();
    fs.cpSync(TEMPLATE_UI_DIR, workDir, { recursive: true });


    // Clean any host-generated Flutter artifacts that may contain Windows paths
    try { fs.rmSync(path.join(workDir, ".dart_tool"), { recursive: true, force: true }); } catch { }
    try { fs.rmSync(path.join(workDir, ".packages"), { recursive: true, force: true }); } catch { }
    try { fs.rmSync(path.join(workDir, ".flutter-plugins"), { recursive: true, force: true }); } catch { }
    try { fs.rmSync(path.join(workDir, ".flutter-plugins-dependencies"), { recursive: true, force: true }); } catch { }

    fs.writeFileSync(
      path.join(workDir, "lib", "solution.dart"),
      ensureUiImport(code)
    );

    // Copy question-level resource files into workspace assets
    const copiedAssetNames = [];
    if (Array.isArray(resourceUrls) && resourceUrls.length > 0) {
      const assetsImagesDir = path.join(workDir, "assets", "images");
      fs.mkdirSync(assetsImagesDir, { recursive: true });

      for (const url of resourceUrls) {
        try {
          const srcPath = path.resolve(process.cwd(), url.replace(/^\//, ""));
          console.log(`[UI TEST] Copying resource from ${srcPath}`);
          if (fs.existsSync(srcPath)) {
            const basename = path.basename(srcPath);
            fs.copyFileSync(srcPath, path.join(assetsImagesDir, basename));
            copiedAssetNames.push(basename);
          } else {
            console.error(`[UI TEST] Resource not found at ${srcPath}`);
          }
        } catch (cpErr) {
          console.error(`[UI TEST] Failed to copy resource ${url}:`, cpErr.message);
        }
      }
      // Delay to allow file system to settle
      await sleep(500);

      // Update pubspec.yaml to declare assets if any were copied
      if (copiedAssetNames.length > 0) {
        console.log(`[UI TEST] Updating pubspec.yaml with ${copiedAssetNames.length} assets`);
        const pubspecPath = path.join(workDir, "pubspec.yaml");
        let pubspec = fs.readFileSync(pubspecPath, "utf-8");
        // Add assets section if not present, or append to existing
        if (!pubspec.includes("assets:")) {
          // Add assets section under flutter:
          pubspec = pubspec.replace(
            /^(flutter:\s*\n)/m,
            `$1  assets:\n    - assets/images/\n`
          );
        } else if (!pubspec.includes("assets/images/")) {
          pubspec = pubspec.replace(
            /^(\s*assets:\s*\n)/m,
            `$1    - assets/images/\n`
          );
        }
        fs.writeFileSync(pubspecPath, pubspec);
        // Delay to allow file write to settle
        await sleep(500);
      }
    }


    // Allow optional host network mode via env vars
    const useHostNetworkUI = process.env.FLUTTER_RUNNER_USE_HOST_NETWORK === "true";
    const networkArg = useHostNetworkUI ? "--network host" : "";
    const containerName = `ui-test-${runId}`;
    const startTime = Date.now();
    const previewPath = path.join(workDir, "test", "goldens", "preview.png");
    let output = "";
    let error = null;

    const execAsync = (cmd, opts = {}) =>
      new Promise((resolveCmd, rejectCmd) => {
        exec(cmd, opts, (err, stdout, stderr) => {
          if (err) {
            err.stdout = stdout;
            err.stderr = stderr;
            return rejectCmd(err);
          }
          return resolveCmd({ stdout, stderr });
        });
      });

    const timeoutHandle = setTimeout(async () => {
      try {
        await execAsync(`docker rm -f ${containerName}`, { timeout: 30000 });
      } catch { }
      resolve({
        status: "ERROR",
        message: `UI render timed out after ${uiTimeoutMs / 1000}s`,
        rawOutput: output,
        executionTimeMs: Date.now() - startTime,
        previewPath: null,
        previewBuffer: null,
      });
    }, uiTimeoutMs);

    try {
      console.log(`[UI TEST] Starting docker: ${containerName}`);

      // Start a long-lived container (no host mounts) to avoid Windows path contamination.
      await execAsync(
        `docker run --name ${containerName} -d ${networkArg} --memory=2g --memory-swap=2g --entrypoint /bin/bash flutter-runner -c "sleep 300"`,
        { timeout: 30000 }
      );

      await execAsync(
        `docker exec ${containerName} /bin/bash -c "mkdir -p /workspace"`,
        { timeout: 30000 }
      );

      // Copy workspace into container (no bind mounts).
      await execAsync(
        `docker cp "${workDir.replace(/\\/g, "/")}/." ${containerName}:/workspace`,
        { timeout: 30000 }
      );

      // Ensure Material Icons font is available in workspace/fonts for tests.
      await execAsync(
        `docker exec ${containerName} /bin/bash -c "mkdir -p /workspace/fonts && cp /sdks/flutter/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf /workspace/fonts/MaterialIcons-Regular.otf"`,
        { timeout: 30000 }
      );

      const runResult = await execAsync(
        `docker exec ${containerName} /bin/bash -c "rm -rf /workspace/.dart_tool /workspace/.packages /workspace/.flutter-plugins /workspace/.flutter-plugins-dependencies && cd /workspace && flutter pub get && flutter test --reporter json -j1 --timeout=60s"`,
        { timeout: uiTimeoutMs }
      );
      output = runResult.stdout.toString() + "\n" + runResult.stderr.toString();
    } catch (err) {
      error = err;
      const stdout = err.stdout ? err.stdout.toString() : "";
      const stderr = err.stderr ? err.stderr.toString() : "";
      output = `${stdout}\n${stderr}`.trim();
      if (err.message && !output.includes(err.message)) {
        output += `\n${err.message}`;
      }
    }

    clearTimeout(timeoutHandle);

    const duration = Date.now() - startTime;
    console.log(`[UI TEST] ===== FULL DOCKER OUTPUT START =====`);
    console.log(output);
    console.log(`[UI TEST] ===== FULL DOCKER OUTPUT END =====`);
    console.log(`[UI TEST] Docker error object:`, error);

    // Copy the file from the container to the host explicitly.
    console.log(`[UI TEST] Copying preview from container ${containerName}...`);
    try {
      await execAsync(
        `docker cp ${containerName}:/workspace/test/goldens/preview.png "${previewPath}"`,
        { timeout: 30000 }
      );
    } catch (cpErr) {
      console.log(`[UI TEST] Docker cp failed: ${cpErr.message}`);
    }

    // Clean up container after copy attempt
    await execAsync(`docker rm -f ${containerName}`, { timeout: 30000 }).catch(() => { });

    console.log(`[UI TEST] Checking preview at: ${previewPath}`);
    const previewExists = fs.existsSync(previewPath);
    console.log(`[UI TEST] Preview exists: ${previewExists}`);

    if (previewExists) {
      console.log(`[UI TEST] ✓ Preview found! Returning success.`);
      const previewBuffer = fs.readFileSync(previewPath);
      resolve({
        status: "OK",
        rawOutput: output,
        executionTimeMs: duration,
        previewPath,
        previewBuffer,
      });
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch {
        setTimeout(() => {
          try {
            fs.rmSync(workDir, { recursive: true, force: true });
          } catch { }
        }, 500);
      }
      return;
    }

    // No preview - fail
    resolve({
      status: "ERROR",
      message: "UI render failed - no preview generated",
      rawOutput: output,
      executionTimeMs: duration,
      previewPath: null,
      previewBuffer: null,
    });
  });
}

export async function runFlutterCustom(code, { functionName, dartArgs }) {
  return new Promise(async (resolve) => {
    const runId = uuidv4();
    const workDir = path.join(BASE_DIR, "runs", runId);

    fs.mkdirSync(workDir, { recursive: true });
    fs.cpSync(TEMPLATE_DIR, workDir, { recursive: true });

    fs.writeFileSync(
      path.join(workDir, "lib", "solution.dart"),
      code
    );

    const testFileContent = buildCustomTestFile(functionName, dartArgs);
    fs.writeFileSync(
      path.join(workDir, "test", "solution_test.dart"),
      testFileContent
    );

    const useHostNetworkCustom = process.env.FLUTTER_RUNNER_USE_HOST_NETWORK === "true";
    const networkArgCustom = useHostNetworkCustom ? "--network host" : "";
    const containerName = `custom-test-${runId}`;
    const startTime = Date.now();
    let output = "";

    const execAsync = (cmd, opts = {}) =>
      new Promise((resolveCmd, rejectCmd) => {
        exec(cmd, opts, (err, stdout, stderr) => {
          if (err) {
            err.stdout = stdout;
            err.stderr = stderr;
            return rejectCmd(err);
          }
          return resolveCmd({ stdout, stderr });
        });
      });

    try {
      await execAsync(
        `docker run --name ${containerName} -d ${networkArgCustom} -v flutter_pub_cache:/root/.pub-cache --entrypoint /bin/bash flutter-runner -c "sleep 300"`,
        { timeout: 30000 }
      );

      await execAsync(
        `docker exec ${containerName} /bin/bash -c "mkdir -p /workspace"`,
        { timeout: 30000 }
      );

      await execAsync(
        `docker cp "${workDir.replace(/\\/g, "/")}/." ${containerName}:/workspace`,
        { timeout: 30000 }
      );

      const runResult = await execAsync(
        `docker exec ${containerName} /bin/bash -c "rm -rf /workspace/.dart_tool /workspace/.packages /workspace/.flutter-plugins /workspace/.flutter-plugins-dependencies && cd /workspace && flutter pub get && flutter test"`,
        { timeout: 300000 }
      );
      output = runResult.stdout.toString() + "\n" + runResult.stderr.toString();
    } catch (err) {
      const stdout = err.stdout ? err.stdout.toString() : "";
      const stderr = err.stderr ? err.stderr.toString() : "";
      output = `${stdout}\n${stderr}`.trim();
      if (err.message && !output.includes(err.message)) {
        output += `\n${err.message}`;
      }
    }

    const duration = Date.now() - startTime;

    try {
      const result = parseFlutterOutput(output, duration);
      resolve({
        ...result,
        rawOutput: output,
        testFileContent,
      });
    } catch {
      resolve({
        status: "ERROR",
        message: "Failed to parse test output",
        rawOutput: output,
        testFileContent,
      });
    } finally {
      try {
        exec(`docker rm -f ${containerName}`);
      } catch { }
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

  const customOutput = extractCustomOutput(printLines, output);

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

function extractCustomOutput(printLines, rawOutput) {
  const prefix = "__CUSTOM_OUTPUT__";
  const line = printLines.find(message => message.includes(prefix));
  if (line) {
    const index = line.indexOf(prefix);
    const direct = line.slice(index + prefix.length).trim();
    if (direct) return direct;
  }

  if (rawOutput) {
    const match = rawOutput.match(new RegExp(`${prefix}([^"\\r\\n]*)`));
    if (match) {
      return match[1].trim();
    }
  }

  return "";
}

