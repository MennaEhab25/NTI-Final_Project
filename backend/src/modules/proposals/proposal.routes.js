import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateProposalSchema } from './proposal.validation.js';
import { accept, mine, reject, shortlist, update, withdraw } from './proposal.controller.js';

const router = Router();
router.use(protect);
router.get('/mine', mine);
router.patch('/:id', validate(updateProposalSchema), update);
router.post('/:id/shortlist', shortlist);
router.post('/:id/accept', accept);
router.post('/:id/reject', reject);
router.post('/:id/withdraw', withdraw);
export default router;
