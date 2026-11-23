// backend/src/routes/analytics.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/overview', analyticsController.overview);
router.get('/assignments/:id', analyticsController.assignmentTracking);

export default router;