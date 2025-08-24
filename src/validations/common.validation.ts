import { z } from 'zod';

// Pagination validation schema
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .default(() => 1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .default(() => 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// UUID validation schema
export const uuidSchema = z.string().uuid();

// Date range validation schema
export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    }
  );

// Search query validation schema
export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters'),
  filters: z.record(z.string(), z.string().optional()).optional(),
});

// File upload validation schema
export const fileUploadSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  maxSize: z
    .number()
    .positive('Max size must be positive')
    .default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif']),
});

// Types for validation
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UUID = z.infer<typeof uuidSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
