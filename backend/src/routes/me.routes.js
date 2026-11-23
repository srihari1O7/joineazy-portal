// backend/src/routes/me.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { query } from '../config/db.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/admin-check', authenticate, requireRole('admin'), (req, res) => {
  res.json({ message: 'Hello professor' });
});

export default router;