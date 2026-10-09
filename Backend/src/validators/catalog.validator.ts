import { z } from 'zod';

export const productQuerySchema = z.object({
  query: z
    .object({
      category: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      search: z.string().optional(),
      featured: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
      recommended: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
      freshToday: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
      available: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
      sort: z.enum(['price_asc', 'price_desc', 'rating', 'popular', 'latest']).optional(),
      page: z
        .string()
        .regex(/^\d+$/)
        .transform((v) => parseInt(v, 10))
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/)
        .transform((v) => parseInt(v, 10))
        .optional(),
    })
    .optional(),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID or slug is required'),
  }),
});
