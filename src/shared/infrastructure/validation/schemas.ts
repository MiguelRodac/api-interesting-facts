import { z } from 'zod'

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
})

export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc')

export const idParamSchema = z.object({
  id: uuidSchema
})

export type InferDto<T extends z.ZodType> = z.infer<T>
