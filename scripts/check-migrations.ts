import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closeDatabase } from '../src/server/db/client';

const here = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const expected = (await fs.readdir(path.join(here, '..', 'db', 'migrations'))).filter((file) => file.endsWith('.sql')).sort();
  const result = await query<{ version: string }>('SELECT version FROM schema_migrations ORDER BY version');
  const applied = result.rows.map((row) => row.version);
  const missing = expected.filter((version) => !applied.includes(version));
  const unexpected = applied.filter((version) => !expected.includes(version));
  if (missing.length || unexpected.length) {
    throw new Error(`Migration mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}`);
  }
  console.log(`Migration check passed: ${applied.length} migration(s) applied`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDatabase());
