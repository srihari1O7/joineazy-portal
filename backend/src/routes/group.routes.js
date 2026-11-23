// backend/src/routes/group.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createGroupSchema, addMemberSchema } from '../validators/group.validator.js';
import * as groupController from '../controllers/group.controller.js';

const router = Router();

router.use(authenticate, requireRole('student'));

router.get('/me', groupController.getMine);
router.post('/', validate(createGroupSchema), groupController.create);
router.post('/members', validate(addMemberSchema), groupController.addMember);
router.delete('/members/:userId', groupController.removeMember);

export default router;