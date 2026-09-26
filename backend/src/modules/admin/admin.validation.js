import { z } from 'zod';

const questionSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required'),
  options: z.array(z.string().trim().min(1)).min(2, 'At least two options are required'),
  correctIndex: z.number({ coerce: true }).int().min(0),
}).strict().superRefine((question, ctx) => {
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
}).strict().refine((data) => Object.keys(data).length > 0, 'At least one field is required');

export const createSkillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required').max(100),
  category: z.string().trim().min(1).max(100).optional(),
  questions: z.array(questionSchema).max(100).optional(),
}).strict();

export const updateSkillSchema = createSkillSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field is required',
);

const OVERSIGHT_MAX_SEARCH_LENGTH = 100;

const oversightQueryShape = {
  page: z.coerce.number().int().positive().optional().catch(undefined),
  limit: z.coerce.number().int().positive().optional().catch(undefined),
  search: z.preprocess(
    (value) => {
      const raw = Array.isArray(value) ? value[0] : value;
      return typeof raw === 'string' ? raw.slice(0, OVERSIGHT_MAX_SEARCH_LENGTH) : raw;
    },
    z.string().trim().max(OVERSIGHT_MAX_SEARCH_LENGTH).optional().catch(undefined),
  ),
};

const singleStatus = (statuses) => z.preprocess(
  (value) => (Array.isArray(value) ? value[0] : value),
  z.enum(statuses).optional().catch(undefined),
);

const oversightQuery = (statuses) => z.object({
  ...oversightQueryShape,
  status: singleStatus(statuses),
}).strip();

export const proposalsQuerySchema = oversightQuery(['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']);
export const contractsQuerySchema = oversightQuery(['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'ACTIVE', 'SUBMITTED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED']);
export const paymentsQuerySchema = oversightQuery(['INITIATED', 'PAID', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED']);
