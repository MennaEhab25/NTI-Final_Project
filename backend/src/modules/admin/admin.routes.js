import { Router } from 'express';
import { validateObjectIdParam } from '../../middleware/validateObjectId.middleware.js';
import { protect, requireAdmin } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import * as controller from './admin.controller.js';
import {
  createSkillSchema,
  updateSkillSchema,
  updateUserSchema,
  proposalsQuerySchema,
  contractsQuerySchema,
  paymentsQuerySchema,
} from './admin.validation.js';

const router = Router();
router.param('id', validateObjectIdParam('id'));
router.use(protect, requireAdmin);
router.get('/dashboard', controller.dashboard);
router.get('/users', controller.users);
router.patch('/users/:id', validate(updateUserSchema), controller.updateUser);
router.get('/projects', controller.projects);
router.get('/skills', controller.skills);
router.post('/skills', validate(createSkillSchema), controller.createSkill);
router.put('/skills/:id', validate(updateSkillSchema), controller.editSkill);
router.delete('/skills/:id', controller.removeSkill);
router.get('/transactions', controller.transactions);
router.get('/revenue', controller.revenue);
router.get('/withdrawals', controller.withdrawals);
router.get('/proposals', validate(proposalsQuerySchema, 'query'), controller.proposals);
router.get('/contracts', validate(contractsQuerySchema, 'query'), controller.contracts);
router.get('/payments', validate(paymentsQuerySchema, 'query'), controller.payments);
router.post('/withdrawals/:id/approve', controller.approve);
router.post('/withdrawals/:id/reject', controller.reject);
export default router;
