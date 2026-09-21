import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { submitDelivery, approveDelivery, requestRevision } from './delivery.controller.js';

const router = Router();

router.use(protect);

router.post('/contracts/:id/deliveries', submitDelivery);
router.post('/deliveries/:id/approve', approveDelivery);
router.post('/deliveries/:id/request-revision', requestRevision);

export default router;