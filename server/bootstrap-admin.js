import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { getPool } from './db.js';

const email = String(process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD || '';

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  throw new Error('INITIAL_ADMIN_EMAIL must be a valid email address.');
}
if (password.length < 10 || password.length > 256) {
  throw new Error('INITIAL_ADMIN_PASSWORD must contain between 10 and 256 characters.');
}

const salt = randomBytes(16).toString('hex');
const passwordHash = scryptSync(password, salt, 64).toString('hex');
const displayName = email.split('@')[0].slice(0, 60) || 'Admin';
const pool = getPool();
const client = await pool.connect();

try {
  await client.query('BEGIN');
  const result = await client.query(
    `INSERT INTO freedex_users
       (id, email, display_name, password_hash, password_salt, role)
     VALUES ($1, $2, $3, $4, $5, 'admin')
     ON CONFLICT (email) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       password_hash = EXCLUDED.password_hash,
       password_salt = EXCLUDED.password_salt,
       role = 'admin'
     RETURNING id`,
    [randomUUID(), email, displayName, passwordHash, salt]
  );

  await client.query('DELETE FROM freedex_sessions WHERE user_id = $1', [
    result.rows[0].id,
  ]);
  await client.query('COMMIT');
  console.log('Administrator account initialized.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
}
