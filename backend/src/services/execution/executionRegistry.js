import { v4 as uuidv4 } from "uuid";
import pool from "../../config/db.js";

const executions = new Map();

function toJsonOrNull(value) {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function fromJsonOrNull(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function persistExecutionRecord(record) {
  if (!record) return;

  await pool.query(
    `
    INSERT INTO execution_runs
    (run_id, mode, session_id, problem_id, user_id, status, metadata, result_json, error_json, created_at, updated_at, started_at, finished_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      mode = VALUES(mode),
      session_id = VALUES(session_id),
      problem_id = VALUES(problem_id),
      user_id = VALUES(user_id),
      status = VALUES(status),
      metadata = VALUES(metadata),
      result_json = VALUES(result_json),
      error_json = VALUES(error_json),
      finished_at = VALUES(finished_at),
      updated_at = VALUES(updated_at)
    `,
    [
      record.runId,
      record.mode,
      record.sessionId,
      record.problemId,
      record.userId,
      record.status,
      toJsonOrNull(record.metadata),
      toJsonOrNull(record.result),
      toJsonOrNull(record.error),
      record.createdAt ? new Date(record.createdAt) : new Date(),
      record.updatedAt ? new Date(record.updatedAt) : new Date(),
      record.startedAt ? new Date(record.startedAt) : new Date(),
      record.finishedAt ? new Date(record.finishedAt) : null,
    ]
  );
}

async function hydrateExecutionRecords() {
  try {
    const [rows] = await pool.query(
      `
      SELECT run_id, mode, session_id, problem_id, user_id, status, metadata, result_json, error_json,
             created_at, updated_at, started_at, finished_at
      FROM execution_runs
      ORDER BY updated_at DESC
      LIMIT 250
      `
    );

    rows.forEach(row => {
      executions.set(row.run_id, {
        runId: row.run_id,
        mode: row.mode,
        sessionId: row.session_id,
        problemId: row.problem_id,
        userId: row.user_id,
        status: row.status,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
        finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : null,
        metadata: fromJsonOrNull(row.metadata) || {},
        result: fromJsonOrNull(row.result_json),
        error: fromJsonOrNull(row.error_json),
      });
    });
  } catch {
    // Best-effort hydration only.
  }
}

void hydrateExecutionRecords();

export function createExecutionRecord({ mode, sessionId = null, problemId = null, userId = null, metadata = {} }) {
  const runId = uuidv4();
  const now = new Date().toISOString();

  const record = {
    runId,
    mode,
    sessionId,
    problemId,
    userId,
    status: "RUNNING",
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    finishedAt: null,
    metadata: { ...metadata },
    result: null,
    error: null,
  };

  executions.set(runId, record);
  void persistExecutionRecord(record).catch(() => {});
  return record;
}

export function updateExecutionRecord(runId, patch) {
  const existing = executions.get(runId);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    metadata: {
      ...existing.metadata,
      ...(patch.metadata || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  executions.set(runId, updated);
  void persistExecutionRecord(updated).catch(() => {});
  return updated;
}

export function completeExecutionRecord(runId, result) {
  return updateExecutionRecord(runId, {
    status: result?.status || "COMPLETED",
    finishedAt: new Date().toISOString(),
    result,
  });
}

export function failExecutionRecord(runId, error) {
  return updateExecutionRecord(runId, {
    status: "FAILED",
    finishedAt: new Date().toISOString(),
    error: {
      message: error?.message || String(error || "Execution failed"),
      detail: error?.detail || null,
    },
  });
}

export function cancelExecutionRecord(runId, reason = "Cancelled by user") {
  return updateExecutionRecord(runId, {
    status: "CANCELLED",
    finishedAt: new Date().toISOString(),
    error: {
      message: reason,
      detail: null,
    },
  });
}

export function getExecutionRecord(runId) {
  return executions.get(runId) || null;
}

export function listExecutionRecords() {
  return Array.from(executions.values()).sort(
    (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
  );
}
