import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, type Database } from '../src/app.js';

async function withApi(db: Database, action: (base: string) => Promise<void>) {
  const server = createApp(db).listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP server address');
  try { await action(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}
test('health reports unavailable when the database fails', async () => {
  await withApi({ query: async () => { throw new Error('offline'); } }, async (base) => {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).database, 'disconnected');
  });
});
test('invalid notes never reach the database', async () => {
  await withApi({ query: () => assert.fail('Unexpected database query') }, async (base) => {
    for (const body of ['', '   ', 'x'.repeat(1001), 42]) {
      const response = await fetch(`${base}/api/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
      assert.equal(response.status, 400);
    }
  });
});
test('notes use parameters so SQL-looking text stays data', async () => {
  const body = "'); DROP TABLE notes; --";
  await withApi({ query: async (sql, parameters) => {
    assert.match(sql, /VALUES \(\$1\)/);
    assert.deepEqual(parameters, [body]);
    return { rows: [{ id: 1, body, created_at: new Date() }] };
  } }, async (base) => {
    const response = await fetch(`${base}/api/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).body, body);
  });
});
