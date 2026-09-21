import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { walletSummary, walletTransactions } from './wallet.controller.js';
const router = Router();
router.use(protect);
router.get('/', walletSummary);
router.get('/transactions', walletTransactions);
export default router;
