import { Router } from 'express';
import { list, markRead, markAllRead, createTest } from './notification.controller.js';

const router = Router();

router.use(protect);
router.get('/', list);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;