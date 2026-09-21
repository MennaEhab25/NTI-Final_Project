// SCAFFOLD ONLY | Owner: Person 1. Implement here; not imported by the demo.
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must not exceed 500 characters")
    .optional(),
  title: z
    .string()
    .trim()
    .max(100, "Title must not exceed 100 characters")
    .optional(),
  avatarUrl: z.url("Invalid URL").optional(),
  activeRole: z.enum(["client", "freelancer"]).optional(),
});

export const listFreelancersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
});
