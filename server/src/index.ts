import { createApp } from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT || 3001);
const server = createApp(pool).listen(port, () => console.log(`API listening at http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      await pool.end();
      clearTimeout(timeout);
    });
  });
}
