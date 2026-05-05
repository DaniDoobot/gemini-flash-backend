import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT = '5432',
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL = 'false',
} = process.env;

const useSsl = String(DB_SSL).toLowerCase() === 'true';

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: DB_HOST,
      port: Number(DB_PORT),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });

export async function getActivePromptRuntimeConfig() {
  const query = `
    SELECT
      p.id,
      p.name,
      p.base_prompt,
      p.initial_message,
      p.selected_voice_slot,
      v.gemini_voice_name,
      v.label AS voice_label
    FROM prompts p
    JOIN voice_settings v
      ON v.slot_number = p.selected_voice_slot
    WHERE p.is_active = TRUE
    LIMIT 1
  `;

  const { rows } = await pool.query(query);
  if (!rows.length) {
    throw new Error('No active prompt found in database');
  }

  return rows[0];
}

export async function pingDb() {
  const { rows } = await pool.query('SELECT NOW() AS now');
  return rows[0];
}

export { pool };