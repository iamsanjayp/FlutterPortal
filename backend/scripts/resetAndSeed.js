import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_NAME || 'mobiledev_portal';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function resetAndSeed() {
  let conn;
  try {
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Connecting to MySQL at ${DB_CONFIG.host} as ${DB_CONFIG.user}...`);
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('Connected. Dropping and recreating database...');

    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await conn.changeUser({ database: DB_NAME });

    console.log('Applying schema.sql...');
    await conn.query(sql);
    console.log('Schema and seed data applied successfully.');
  } catch (err) {
    console.error('Failed to reset/seed database:', err.message);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

resetAndSeed();
