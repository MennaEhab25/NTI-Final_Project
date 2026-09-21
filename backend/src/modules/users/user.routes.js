import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateProfileSchema } from './user.validation.js';
import * as controller from './user.controller.js';

const router = Router();
router.get('/me', protect, controller.me);
router.patch('/me', protect, validate(updateProfileSchema), controller.updateMe);
router.get('/:id', controller.publicProfile);
export default router;
