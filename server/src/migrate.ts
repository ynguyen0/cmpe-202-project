import { pool } from './db.js';

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log('Database ready: notes table exists.');
} finally {
  await pool.end();
}
