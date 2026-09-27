import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Homebrew's Docker CLI may not discover Docker Desktop's bundled plugins.
const args = process.argv.slice(2);
const bundledCompose = '/Applications/Docker.app/Contents/Resources/cli-plugins/docker-compose';
const hasCompose = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' }).status === 0;
const command = hasCompose ? 'docker' : bundledCompose;
if (!hasCompose && !existsSync(bundledCompose)) {
  console.error('Docker Compose is required. Install Docker Desktop or the Docker Compose plugin.');
  process.exit(1);
}
const result = spawnSync(command, hasCompose ? ['compose', ...args] : args, { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
