import { z } from 'zod';

// Kept free of server imports so the admin form can validate with it too.
export const wigUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(2000).nullable(),
  price: z.number().positive('Price must be positive').nullable(),
});

export type WigUpdateInput = z.infer<typeof wigUpdateSchema>;
