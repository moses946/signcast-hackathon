import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { zipSync } from 'fflate';

const files = {};
async function include(path, archivePath = path) {
  files[archivePath] = new Uint8Array(await readFile(path));
}
async function directory(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await directory(child);
    else await include(child, child.replaceAll('\\', '/'));
  }
}
// Explicit public allowlist: never recurse through .env, credentials, or artifacts.
for (const path of ['submission', 'assets/branding/twitch']) await directory(path);
for (const path of ['CONTEXT.md', 'HANDOFF.md', 'README.md']) await include(path);
await include('artifacts/signcast-extension.zip', 'signcast-extension.zip');
await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/signcast-submission-kit.zip',
  zipSync(files, { level: 9, mtime: new Date('2026-01-01T00:00:00Z') }),
);
console.log('Created artifacts/signcast-submission-kit.zip from explicit public files only.');
