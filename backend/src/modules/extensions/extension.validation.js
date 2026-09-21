import { z } from 'zod';

export const createExtensionSchema = z.object({
  requestedDays: z.number({ coerce: true }).int().positive('requestedDays must be a positive whole number'),
  reason: z.string().trim().min(1, 'Reason is required').max(1000),
});
