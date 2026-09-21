import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { details, mine, pdf, start } from './contract.controller.js';
import { createForContract } from '../extensions/extension.controller.js';
import { createExtensionSchema } from '../extensions/extension.validation.js';

const router = Router();
router.use(protect);
router.get('/', mine);
router.get('/:id/pdf', pdf);
router.post('/:id/start', start);
router.post('/:id/extensions', validate(createExtensionSchema), createForContract);
router.get('/:id', details);
export default router;
