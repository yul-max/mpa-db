import { z } from 'zod';
export const fieldRules: Record<string, any> = {
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'contributor', 'viewer']),
  province: z.string().optional(),
  municipality: z.string().optional(),
  isProtected: z.boolean().optional(),
  files: z.any().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').or(z.literal(''))
};
export function buildFormSchema(fields: string[]) {
  const shape: Record<string, any> = {};
  fields.forEach(f => { if (fieldRules[f]) shape[f] = fieldRules[f]; });
  return z.object(shape);
}
