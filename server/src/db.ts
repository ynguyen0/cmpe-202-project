import { readFileSync } from 'node:fs';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. See server/.env.example.');
const url = new URL(process.env.DATABASE_URL);
for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
  if (url.searchParams.has(key)) throw new Error(`Use DB_SSL / DB_SSL_CA instead of ${key} in DATABASE_URL.`);
}
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: readFileSync(process.env.DB_SSL_CA, 'utf8') } : {}) }
    : false,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});
pool.on('error', (error) => console.error('Idle database connection failed:', error.message));
