import { Router } from 'express';
import { validateObjectIdParam } from '../../middleware/validateObjectId.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { byContract, checkout, findPayment, mine, release, webhook } from './payment.controller.js';
import { checkoutSchema } from './payment.validation.js';

const router = Router();
router.param('contractId', validateObjectIdParam('contractId'));
router.param('id', validateObjectIdParam('id'));
router.post('/webhook', webhook); // Paymob calls this route, so it must stay public. HMAC verification protects it.
router.post('/checkout', protect, validate(checkoutSchema), checkout);
router.get('/mine', protect, mine);
router.get('/contract/:contractId', protect, byContract);
router.get('/:id', protect, findPayment);
router.post('/:id/release', protect, release);
export default router;
