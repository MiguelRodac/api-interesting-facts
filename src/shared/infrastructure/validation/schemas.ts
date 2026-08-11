import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../../domain/types/query-filters'

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT)
})

export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc')

export const idParamSchema = z.object({
  id: uuidSchema
})

export type InferDto<T extends z.ZodType> = z.infer<T>
