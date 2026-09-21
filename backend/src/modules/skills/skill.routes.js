import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './skill.controller.js';
import { assessSkillSchema } from './skill.validation.js';

const router = Router();
router.get('/', controller.list);
router.get('/:id/questions', protect, controller.questions);
router.post('/:id/assess', protect, validate(assessSkillSchema), controller.assess);
export default router;
