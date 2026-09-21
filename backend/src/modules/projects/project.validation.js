import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine(
  (value) => mongoose.Types.ObjectId.isValid(value),
  'Skill ID must be a valid ID',
);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  category: z.string().trim().min(1, 'Category is required').max(100),
  requiredSkills: z.array(objectId).optional().default([]),
  budget: z.number({ coerce: true }).positive('Budget must be greater than zero'),
  duration: z.number({ coerce: true }).int().positive('Duration must be greater than zero'),
  attachments: z.array(z.string()).optional().default([]),
  deadline: z.string().datetime().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
