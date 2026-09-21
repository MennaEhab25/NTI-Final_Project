import { Router } from 'express';
import { approve, reject } from './extension.controller.js';

const router = Router();
router.post('/:id/approve', approve);
router.post('/:id/reject', reject);
export default router;
