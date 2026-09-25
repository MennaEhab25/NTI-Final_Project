import { z } from 'zod';
import { egyptianMobilePattern, normalizeEgyptianMobile } from '../../utils/inputValidation.js';

export const createWithdrawalSchema = z.object({
  amount: z.number({ coerce: true }).finite().positive('Amount must be greater than zero').max(10000000, 'Amount is too large'),
  method: z.enum(['MOBILE_WALLET', 'BANK'], { error: 'method must be MOBILE_WALLET or BANK' }),
  accountDetails: z.string().trim().min(1, 'Account details are required').max(500),
}).strict().superRefine((data, ctx) => {
  if (data.method === 'MOBILE_WALLET') {
    const mobile = normalizeEgyptianMobile(data.accountDetails);
    if (!egyptianMobilePattern.test(data.accountDetails.replace(/[\s()-]/g, '')) || !/^01[0125]\d{8}$/.test(mobile)) {
      ctx.addIssue({ code: 'custom', path: ['accountDetails'], message: 'Enter a valid Egyptian mobile-wallet number' });
    } else {
      data.accountDetails = mobile;
    }
    return;
  }

  if (data.accountDetails.length < 8) {
    ctx.addIssue({ code: 'custom', path: ['accountDetails'], message: 'Enter valid bank account details' });
  }
});
