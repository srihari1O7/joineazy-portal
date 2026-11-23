// backend/src/routes/assignment.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { assignmentSchema } from '../validators/assignment.validator.js';
import * as assignmentController from '../controllers/assignment.controller.js';
import * as submissionController from '../controllers/submission.controller.js';

const router = Router();

router.use(authenticate);

// Student routes
router.get('/mine', requireRole('student'), submissionController.listMine);
router.post('/:id/confirm', requireRole('student'), submissionController.confirm);

// Admin routes
router.get('/', requireRole('admin'), assignmentController.listAll);
router.get('/:id', requireRole('admin'), assignmentController.getOne);
router.post('/', requireRole('admin'), validate(assignmentSchema), assignmentController.create);
router.put('/:id', requireRole('admin'), validate(assignmentSchema), assignmentController.update);
router.delete('/:id', requireRole('admin'), assignmentController.remove);

export default router;