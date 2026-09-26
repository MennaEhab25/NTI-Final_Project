import { z } from 'zod';
import mongoose from 'mongoose';
import { egyptianMobileSchema } from '../../utils/inputValidation.js';

export const checkoutSchema = z.object({
  contractId: z.string().trim().refine((v) => mongoose.Types.ObjectId.isValid(v), 'contractId must be a valid ID'),
  customerName: z.string().trim().min(2).max(100).optional(),
  customerEmail: z.string().trim().email('customerEmail must be a valid email').max(254).optional(),
  customerMobile: egyptianMobileSchema,
  description: z.string().trim().max(500).optional(),
}).strict();
