import { Router } from 'express';
import { create, details, list, mine, remove, update } from './project.controller.js';
import { validateProject } from './project.validation.js';
import { createForProject, listForProject } from '../proposals/proposal.controller.js';

const router = Router();

router.post('/', validateProject, create);
router.get('/', list);
router.get('/mine', mine);
router.post('/:id/proposals', createForProject);
router.get('/:id/proposals', listForProject);
router.get('/:id', details);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;
