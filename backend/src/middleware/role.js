// backend/src/middleware/role.js
import { httpError } from '../utils/httpError.js';

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(httpError(403, 'You do not have permission to do this'));
  }
  next();
};