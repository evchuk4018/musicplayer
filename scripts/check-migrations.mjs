import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const expected = (await fs.readdir(path.join(process.cwd(), 'db', 'migrations'))).filter((file) => file.endsWith('.sql')).sort();
  const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
  const applied = result.rows.map((row) => row.version);
  const missing = expected.filter((version) => !applied.includes(version));
  if (missing.length) throw new Error(`Missing migrations: ${missing.join(', ')}`);
  console.log(`Migration check passed: ${applied.length} migration(s) applied`);
} finally {
  await pool.end();
}
