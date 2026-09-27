import assert from 'node:assert/strict';
import { pool } from './db.js';

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const info = await client.query<{ database: string; version: string }>(
      'SELECT current_database() AS database, version() AS version',
    );
    const marker = `Connection check ${crypto.randomUUID()}`;
    const inserted = await client.query<{ id: number }>(
      'INSERT INTO notes (body) VALUES ($1) RETURNING id', [marker],
    );
    const saved = await client.query<{ body: string }>(
      'SELECT body FROM notes WHERE id = $1', [inserted.rows[0].id],
    );
    assert.equal(saved.rows[0]?.body, marker);
    console.log(`Connected to ${info.rows[0].database}: ${info.rows[0].version}`);
    console.log('Schema, insert, and read checks passed. Test note rolled back.');
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
} finally {
  await pool.end();
}
