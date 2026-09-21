import { z } from 'zod';

const questionSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required'),
  options: z.array(z.string().trim().min(1)).min(2, 'At least two options are required'),
  correctIndex: z.number({ coerce: true }).int().min(0),
}).superRefine((question, ctx) => {
  if (question.correctIndex >= question.options.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['correctIndex'],
      message: 'correctIndex must point to a valid option',
    });
  }
});

export const updateUserSchema = z.object({
  status: z.enum(['active', 'suspended']).optional(),
  isAdmin: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field is required');

export const createSkillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required').max(100),
  category: z.string().trim().min(1).max(100).optional(),
  questions: z.array(questionSchema).optional(),
});

export const updateSkillSchema = createSkillSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field is required',
);
