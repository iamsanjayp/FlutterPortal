import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
});

const rootPool = process.env.MYSQL_ROOT_PASSWORD
  ? mysql.createPool({
      host: process.env.DB_HOST,
      user: "root",
      password: process.env.MYSQL_ROOT_PASSWORD,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 10,
    })
  : null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function ensureSlotRegistrationTable() {
  await pool.query(
    `
    CREATE TABLE IF NOT EXISTS test_schedule_registrations (
      schedule_id INT NOT NULL,
      user_id BIGINT NOT NULL,
      source VARCHAR(32) NOT NULL DEFAULT 'UI',
      created_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (schedule_id, user_id),
      KEY idx_schedule_registrations_user (user_id),
      CONSTRAINT fk_schedule_registrations_schedule FOREIGN KEY (schedule_id) REFERENCES test_schedules(id) ON DELETE CASCADE,
      CONSTRAINT fk_schedule_registrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_schedule_registrations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `
  );
}

async function ensureLevelDashboardColumns() {
  const columns = [
    ["student_overview", "TEXT NULL"],
    ["portions_text", "LONGTEXT NULL"],
    ["resource_links_text", "LONGTEXT NULL"],
  ];

  for (const [columnName, columnDefinition] of columns) {
    const [[columnRow]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'levels'
        AND COLUMN_NAME = ?
      `,
      [columnName]
    );

    if (!columnRow?.total) {
      await pool.query(`ALTER TABLE levels ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }
}

async function ensureLevelAssessmentTypeColumn() {
  try {
    await pool.query("ALTER TABLE levels MODIFY COLUMN assessment_type VARCHAR(50) NOT NULL DEFAULT 'TEST_CASE'");
    await pool.query("UPDATE levels SET assessment_type = 'FLUTTER_UI' WHERE assessment_type = 'UI_COMPARE'");
  } catch (err) {
    console.warn("Could not modify assessment_type column in levels table:", err.message);
  }
}

async function ensureProblemAdvancedColumns() {
  const columns = [
    ["project_files", "LONGTEXT NULL"],
    ["required_packages", "TEXT NULL"],
    ["mock_api_route", "VARCHAR(255) NULL"],
    ["mock_api_response", "LONGTEXT NULL"],
    ["mock_db_seed", "LONGTEXT NULL"],
    ["custom_test_code", "LONGTEXT NULL"],
  ];

  for (const [columnName, columnDefinition] of columns) {
    const [[columnRow]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = ?
      `,
      [columnName]
    );

    if (!columnRow?.total) {
      await pool.query(`ALTER TABLE problems ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }
}

async function ensureExecutionRunsTable() {
  await pool.query(
    `
    CREATE TABLE IF NOT EXISTS execution_runs (
      run_id VARCHAR(36) NOT NULL,
      mode VARCHAR(32) NOT NULL,
      session_id BIGINT NULL,
      problem_id BIGINT NULL,
      user_id BIGINT NULL,
      status VARCHAR(32) NOT NULL,
      metadata LONGTEXT NULL,
      result_json LONGTEXT NULL,
      error_json LONGTEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME NULL,
      PRIMARY KEY (run_id),
      KEY idx_execution_runs_session (session_id),
      KEY idx_execution_runs_problem (problem_id),
      KEY idx_execution_runs_user (user_id),
      KEY idx_execution_runs_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `
  );
}

async function repairPortalUserWithRoot() {
  if (!rootPool) {
    throw new Error("MYSQL_ROOT_PASSWORD is not configured");
  }

  const connection = await rootPool.getConnection();
  try {
    const databaseName = connection.escapeId(process.env.DB_NAME);
    const userName = connection.escape(process.env.DB_USER);
    const userPassword = connection.escape(process.env.DB_PASSWORD);

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
    await connection.query(
      `CREATE USER IF NOT EXISTS ${userName}@'%' IDENTIFIED BY ${userPassword}`
    );
    await connection.query(
      `ALTER USER ${userName}@'%' IDENTIFIED BY ${userPassword}`
    );
    await connection.query(
      `GRANT ALL PRIVILEGES ON ${databaseName}.* TO ${userName}@'%'`
    );
    await connection.query("FLUSH PRIVILEGES");
  } finally {
    connection.release();
  }
}

let databaseReady = false;

(async () => {
  while (!databaseReady) {
    try {
      const connection = await pool.getConnection();
      console.log("✅ Database connected successfully");
      connection.release();
      await ensureSlotRegistrationTable();
      await ensureLevelDashboardColumns();
      await ensureLevelAssessmentTypeColumn();
      await ensureProblemAdvancedColumns();
      await ensureExecutionRunsTable();
      databaseReady = true;
      return;
    } catch (err) {
      console.warn("⚠️ Primary database login failed, attempting repair:", err.message);

      try {
        await repairPortalUserWithRoot();
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully after repair");
        connection.release();
        await ensureSlotRegistrationTable();
        await ensureLevelDashboardColumns();
        await ensureLevelAssessmentTypeColumn();
        await ensureProblemAdvancedColumns();
        await ensureExecutionRunsTable();
        databaseReady = true;
        return;
      } catch (repairErr) {
        console.warn("⚠️ Database not ready yet, retrying:", repairErr.message);
        await sleep(5000);
      }
    }
  }
})();

export default pool;
