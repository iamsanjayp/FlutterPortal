import {
  runFlutterCode,
  runFlutterCustom,
  runFlutterUI,
} from "../../execution/flutter/runFlutter.js";
import {
  createExecutionRecord,
  cancelExecutionRecord,
  completeExecutionRecord,
  failExecutionRecord,
  getExecutionRecord,
  listExecutionRecords,
} from "./executionRegistry.js";

export function executeFlutterTestRun(code, options) {
  const record = createExecutionRecord({
    mode: "TEST_CASE",
    sessionId: options?.sessionId ?? null,
    problemId: options?.problemId ?? null,
    userId: options?.userId ?? null,
  });

  return runFlutterCode(code, options)
    .then(result => {
      completeExecutionRecord(record.runId, result);
      return { ...result, runId: record.runId };
    })
    .catch(error => {
      failExecutionRecord(record.runId, error);
      throw error;
    });
}

export function executeFlutterCustomRun(code, options) {
  const record = createExecutionRecord({
    mode: "CUSTOM",
    userId: options?.userId ?? null,
  });

  return runFlutterCustom(code, options)
    .then(result => {
      completeExecutionRecord(record.runId, result);
      return { ...result, runId: record.runId };
    })
    .catch(error => {
      failExecutionRecord(record.runId, error);
      throw error;
    });
}

export function executeFlutterUiPreview(code, resourceUrls = [], options = {}) {
  const record = createExecutionRecord({
    mode: "UI_PREVIEW",
    sessionId: options?.sessionId ?? null,
    problemId: options?.problemId ?? null,
    userId: options?.userId ?? null,
  });

  return runFlutterUI(code, resourceUrls, options)
    .then(result => {
      completeExecutionRecord(record.runId, result);
      return { ...result, runId: record.runId };
    })
    .catch(error => {
      failExecutionRecord(record.runId, error);
      throw error;
    });
}

export function executeFlutterUiSubmission(code, resourceUrls = [], options = {}) {
  const record = createExecutionRecord({
    mode: "UI_SUBMISSION",
    sessionId: options?.sessionId ?? null,
    problemId: options?.problemId ?? null,
    userId: options?.userId ?? null,
  });

  return runFlutterUI(code, resourceUrls, options)
    .then(result => {
      completeExecutionRecord(record.runId, result);
      return { ...result, runId: record.runId };
    })
    .catch(error => {
      failExecutionRecord(record.runId, error);
      throw error;
    });
}

export function getExecutionRun(runId) {
  return getExecutionRecord(runId);
}

export function listExecutionRuns() {
  return listExecutionRecords();
}

export function cancelExecutionRun(runId, reason) {
  return cancelExecutionRecord(runId, reason);
}
