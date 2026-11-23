// backend/src/config/db.js
import pg from 'pg';
import { env } from './env.js';

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

export const query = (text, params) => pool.query(text, params);

export default pool;