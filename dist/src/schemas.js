import { z } from 'zod';
// Authentication schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});
// Notes schemas
export const createNoteSchema = z.object({
    content: z.string().min(1, 'Content is required').max(1000, 'Content must be less than 1000 characters')
});
// Common response schemas
export const errorResponseSchema = z.object({
    error: z.string()
});
export const successResponseSchema = z.object({
    message: z.string()
});
//# sourceMappingURL=schemas.js.map