// backend/src/validators/group.validator.js
import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'Group name must be at least 2 characters').max(100),
});

export const addMemberSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});