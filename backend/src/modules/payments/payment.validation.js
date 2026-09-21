import { z } from 'zod';
import mongoose from 'mongoose';

export const checkoutSchema = z.object({
  contractId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), 'contractId must be a valid ID'),
  customerName: z.string().trim().min(1, 'customerName is required'),
  customerEmail: z.string().email('customerEmail must be a valid email'),
  customerMobile: z.string().trim().min(1, 'customerMobile is required'),
  description: z.string().trim().max(500).optional(),
});
