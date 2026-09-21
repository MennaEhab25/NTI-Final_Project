import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { approve, reject } from './extension.controller.js';
const router = Router();
router.use(protect);
router.post('/:id/approve', approve);
router.post('/:id/reject', reject);
export default router;
