// backend/src/server.js
import app from './app.js';
import pool from './config/db.js';
import { env } from './config/env.js';

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();