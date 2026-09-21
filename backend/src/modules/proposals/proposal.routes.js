import { Router } from 'express';
import { accept, mine, reject, shortlist, update, withdraw } from './proposal.controller.js';

const router = Router();
router.get('/mine', mine);
router.patch('/:id', update);
router.post('/:id/shortlist', shortlist);
router.post('/:id/accept', accept);
router.post('/:id/reject', reject);
router.post('/:id/withdraw', withdraw);
export default router;
