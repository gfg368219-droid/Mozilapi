import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

// Replit-managed PostgreSQL schema changes are applied through Replit's
// database flow. External hosts (Railway, Render, etc.) use npm's prestart hook.
if (process.env.REPL_ID) {
  console.log('Replit environment detected; database schema changes remain managed by Replit.');
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to initialize the external PostgreSQL schema.');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10_000
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [741205309]);
    const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
    await client.query(schema);
    await client.query('COMMIT');
    console.log('External PostgreSQL schema is ready.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
