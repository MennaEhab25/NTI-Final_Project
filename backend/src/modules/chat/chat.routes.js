import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { getMessages } from './chat.controller.js';

const router = Router();
router.use(protect);
router.get('/:contractId/messages', getMessages);

export default router;