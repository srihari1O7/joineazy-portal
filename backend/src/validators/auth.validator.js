// backend/src/validators/auth.validator.js
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  adminCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});