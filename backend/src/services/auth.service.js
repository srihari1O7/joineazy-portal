// backend/src/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const registerUser = async ({ name, email, password, adminCode }) => {
  const cleanEmail = email.toLowerCase().trim();

  const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    throw httpError(409, 'Email already registered');
  }

  let role = 'student';
  if (adminCode) {
    if (!env.adminSignupCode || adminCode !== env.adminSignupCode) {
      throw httpError(403, 'Invalid admin code');
    }
    role = 'admin';
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name.trim(), cleanEmail, passwordHash, role]
  );

  const user = result.rows[0];
  return { user, token: signToken(user) };
};

export const loginUser = async ({ email, password }) => {
  const result = await query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  const row = result.rows[0];
  const valid = row && (await bcrypt.compare(password, row.password_hash));
  if (!valid) {
    throw httpError(401, 'Invalid email or password');
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  return { user, token: signToken(user) };
};