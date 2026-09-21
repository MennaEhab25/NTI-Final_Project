import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import skillRoutes from '../modules/skills/skill.routes.js';
import projectRoutes from '../modules/projects/project.routes.js';
import proposalRoutes from '../modules/proposals/proposal.routes.js';
import contractRoutes from '../modules/contracts/contract.routes.js';
import extensionRoutes from '../modules/extensions/extension.routes.js';
import paymentRoutes from '../modules/payments/payment.routes.js';
import walletRoutes from '../modules/wallet/wallet.routes.js';
import withdrawalRoutes from '../modules/withdrawals/withdrawal.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import { freelancers } from '../modules/users/user.controller.js';
import chatRoutes from '../modules/chat/chat.routes.js';

const router = Router();

// Person 1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.get('/freelancers', freelancers);
router.use('/skills', skillRoutes);

// Person 2
router.use('/projects', projectRoutes);
router.use('/proposals', proposalRoutes);
router.use('/contracts', contractRoutes);
router.use('/extensions', extensionRoutes);

//person3
router.use('/chat', chatRoutes);

// Person 4
router.use('/payments', paymentRoutes);
router.use('/wallet', walletRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/admin', adminRoutes);



export default router;
