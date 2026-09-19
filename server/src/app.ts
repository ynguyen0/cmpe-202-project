import express, { type ErrorRequestHandler } from 'express';

interface NoteRow {
  id: number;
  body: string;
  created_at: Date;
}

export interface Database {
  query(sql: string, parameters?: string[]): Promise<{ rows: NoteRow[] }>;
}
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function createApp(db: Database) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(503).json({ status: 'unavailable', database: 'disconnected' });
    }
  });
  app.get('/api/notes', async (_req, res) => {
    const { rows } = await db.query('SELECT id, body, created_at FROM notes ORDER BY created_at DESC, id DESC LIMIT 100');
    res.json(rows);
  });
  app.post('/api/notes', async (req, res) => {
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body || body.length > 1000) return res.status(400).json({ error: 'Enter a note between 1 and 1000 characters.' });
    const { rows } = await db.query('INSERT INTO notes (body) VALUES ($1) RETURNING id, body, created_at', [body]);
    res.status(201).json(rows[0]);
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/{*path}', (_req, res) => res.sendFile(`${clientDist}/index.html`));
  }
  const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const failure = error instanceof Error ? error : new Error(String(error));
    const errorStatus = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
    const status = errorStatus === 400 || errorStatus === 413 ? errorStatus : 500;
    if (status === 500) console.error('Request failed:', failure.message);
    res.status(status).json({ error: status === 500 ? 'Server error. Check the database connection and migrations.' : 'Invalid request body.' });
  };
  app.use(handleError);
  return app;
}
