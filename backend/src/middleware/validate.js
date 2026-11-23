// backend/src/middleware/validate.js
import { httpError } from '../utils/httpError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(', ');
    return next(httpError(400, message));
  }
  req.body = result.data;
  next();
};