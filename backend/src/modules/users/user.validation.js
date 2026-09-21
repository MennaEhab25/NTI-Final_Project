import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  title: z.string().trim().max(100).optional(),
  avatarUrl: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
  activeRole: z.enum(['client', 'freelancer']).optional(),
  roles: z.array(z.enum(['client', 'freelancer'])).min(1).optional(),
  portfolio: z.array(z.object({
    title: z.string().trim().min(1),
    description: z.string().optional().default(''),
    image: z.string().optional().default(''),
    link: z.string().optional().default(''),
  })).optional(),
});
