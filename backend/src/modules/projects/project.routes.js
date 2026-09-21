import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from './project.validation.js';
import { create, details, list, mine, remove, update } from './project.controller.js';
import { createForProject, listForProject } from '../proposals/proposal.controller.js';
import { createProposalSchema } from '../proposals/proposal.validation.js';

const router = Router();
router.get('/', list);
router.get('/mine', protect, mine);
router.post('/', protect, validate(createProjectSchema), create);
router.post('/:id/proposals', protect, validate(createProposalSchema), createForProject);
router.get('/:id/proposals', protect, listForProject);
router.get('/:id', details);
router.patch('/:id', protect, validate(updateProjectSchema), update);
router.delete('/:id', protect, remove);
export default router;
