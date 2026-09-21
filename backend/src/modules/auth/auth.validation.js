import { z } from 'zod';

const email = z.string().trim().email('Invalid email address').toLowerCase();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8).max(72),
  roles: z.array(z.enum(['client', 'freelancer'])).min(1).optional(),
});

export const loginSchema = z.object({ email, password: z.string().min(1) });
export const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token: z.string().min(1), password: z.string().min(8).max(72) });
