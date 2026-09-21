import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { getTimeline } from './audit.controller.js';

const router = Router();

router.use(protect);
router.get('/contracts/:id/timeline', getTimeline);

export default router;