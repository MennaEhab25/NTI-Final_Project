import { Router } from 'express';
import { details, pdf, start } from './contract.controller.js';
import { createForContract } from '../extensions/extension.controller.js';

const router = Router();
router.get('/:id/pdf', pdf);
router.post('/:id/start', start);
router.post('/:id/extensions', createForContract);
router.get('/:id', details);
export default router;
