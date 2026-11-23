// backend/src/validators/assignment.validator.js
import { z } from 'zod';

export const assignmentSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().trim().max(2000).optional().default(''),
  dueDate: z.coerce.date({ invalid_type_error: 'Enter a valid due date' }),
  onedriveLink: z.string().trim().url('Enter a valid OneDrive link'),
  groupIds: z.array(z.number().int().positive()).optional().default([]),
});