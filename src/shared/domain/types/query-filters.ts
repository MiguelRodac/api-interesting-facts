export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20

export type FilterValue = string | number | string[]

export type QueryFilters = Record<string, FilterValue>

export interface SearchOrderParams {
  order_by?: 'popular' | 'recent'
  order_dir?: 'asc' | 'desc'
  limit?: number
}

export interface BaseQueryParams {
  order_by?: string
  order_dir?: string
  page?: number
  limit?: number
}

export interface ResultWithPagination<T> {
  results: T[]
  limit: number
  page: number
  nextPage: number | null
}

const RESERVED_KEYS = new Set(['order_by', 'order_dir', 'page', 'limit'])

type DtoScalar = string | number | boolean | Date | string[] | Date[] | null | undefined

export function toQueryParams<T extends Record<string, DtoScalar>> (dto: T): {
  base: BaseQueryParams
  filters: QueryFilters
} {
  const base: BaseQueryParams = {}
  const filters: QueryFilters = {}

  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined || value === null) continue

    if (RESERVED_KEYS.has(key)) {
      if (key === 'page' || key === 'limit') {
        (base as Record<string, unknown>)[key] = typeof value === 'number' ? value : Number(value)
      } else {
        (base as Record<string, unknown>)[key] = String(value)
      }
    } else {
      if (value instanceof Date) {
        filters[key] = value.toISOString().slice(0, 10)
      } else if (Array.isArray(value)) {
        filters[key] = value.map((v) =>
          v instanceof Date ? v.toISOString().slice(0, 10) : String(v)
        )
      } else if (typeof value === 'boolean') {
        filters[key] = value ? '1' : '0'
      } else if (typeof value === 'string' || typeof value === 'number') {
        filters[key] = value
      }
    }
  }

  return { base, filters }
}

export function parseFilterKey (key: string): { field: string, op: string } | null {
  const match = key.match(/^(.+)__(eq|like|gt|gte|lt|lte|in|between)$/)
  if (match == null) return null
  return { field: match[1], op: match[2] }
}

export type PrismaWhere = Record<string, unknown>

export function buildPaginatedResult<T> (
  items: T[],
  total: number,
  page: number,
  limit: number
): ResultWithPagination<T> {
  return {
    results: items,
    page,
    limit,
    nextPage: page * limit < total ? page + 1 : null
  }
}

export function buildPrismaWhere (filters: QueryFilters, fieldMap?: Record<string, string>): PrismaWhere {
  const where: PrismaWhere = {}

  for (const [key, value] of Object.entries(filters)) {
    const parsed = parseFilterKey(key)
    if (parsed == null) {
      where[key] = value
      continue
    }

    const { field, op } = parsed
    const prismaField = fieldMap?.[field] ?? field

    switch (op) {
      case 'eq':
        where[prismaField] = value
        break
      case 'like':
        where[prismaField] = { contains: String(value) }
        break
      case 'gt':
        where[prismaField] = { gt: Number(value) }
        break
      case 'gte':
        where[prismaField] = { gte: Number(value) }
        break
      case 'lt':
        where[prismaField] = { lt: Number(value) }
        break
      case 'lte':
        where[prismaField] = { lte: Number(value) }
        break
      case 'in':
        where[prismaField] = { in: Array.isArray(value) ? value : [value] }
        break
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          where[prismaField] = {
            gte: value[0],
            lte: value[1]
          }
        }
        break
    }
  }

  return where
}
