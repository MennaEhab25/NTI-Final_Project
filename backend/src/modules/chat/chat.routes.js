import { Router } from 'express';
import { getMessages } from './chat.controller.js';

const router = Router();

router.get('/:contractId/messages', getMessages);

export default router;