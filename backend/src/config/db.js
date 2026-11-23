// backend/src/config/db.js
import pg from 'pg';
import { env } from './env.js';

// Hosted databases (like Neon) require SSL; local Docker Postgres does not.
const needsSsl = /sslmode=require|neon\.tech/.test(env.databaseUrl);

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

export const query = (text, params) => pool.query(text, params);

export default pool;