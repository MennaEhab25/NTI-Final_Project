import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { byContract, checkout, findPayment, release, webhook } from './payment.controller.js';
import { checkoutSchema } from './payment.validation.js';

const router = Router();
router.post('/webhook', webhook); // Fawry calls this route, so it must stay public.
router.post('/checkout', protect, validate(checkoutSchema), checkout);
router.get('/contract/:contractId', protect, byContract);
router.get('/:id', protect, findPayment);
router.post('/:id/release', protect, release);
export default router;
