// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(httpError(401, 'Authentication required'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    next(httpError(401, 'Invalid or expired token'));
  }
};