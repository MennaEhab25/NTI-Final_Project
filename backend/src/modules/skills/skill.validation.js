import { z } from 'zod';

export const assessSkillSchema = z.object({
  answers: z.array(z.number({ coerce: true }).int().min(0)).min(1, 'Answers are required'),
});
