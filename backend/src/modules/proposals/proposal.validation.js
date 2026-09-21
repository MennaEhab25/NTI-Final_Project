import { z } from 'zod';

export const createProposalSchema = z.object({
  price: z.number({ coerce: true }).positive('Price must be greater than zero'),
  duration: z.number({ coerce: true }).int().positive('Duration must be greater than zero'),
  coverLetter: z.string().trim().min(1, 'Cover letter is required').max(5000),
});

export const updateProposalSchema = createProposalSchema.partial();
