import { z } from 'zod';

export const createWithdrawalSchema = z.object({
  amount: z.number({ coerce: true }).positive('Amount must be greater than zero'),
  method: z.enum(['MOBILE_WALLET', 'BANK'], { error: 'method must be MOBILE_WALLET or BANK' }),
  accountDetails: z.string().trim().min(1, 'Account details are required').max(500),
});
