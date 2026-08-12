import prisma from '@shared/infrastructure/prisma'
import { type Fact, type CreateFactData, type UpdateFactData } from '../../domain/entities/Fact'
import { type FactRepository } from '../../domain/ports/FactRepository'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'
import { ValidationError } from '@shared/domain/errors/ValidationError'

function buildOrderBy (orderBy?: string, orderDir?: string): Record<string, unknown> {
  if (orderBy == null) return { createdAt: 'desc' }
  const dir: 'asc' | 'desc' = orderDir === 'asc' ? 'asc' : 'desc'

  // Campos directos de Prisma para facts
  const validFields = ['createdAt', 'updatedAt', 'authorId']
  if (validFields.includes(orderBy)) {
    return { [orderBy]: dir }
  }

  // likesCount requiere _count select (solo en findPopular)
  if (orderBy === 'likesCount') {
    return { likes: { _count: dir } }
  }

  // Campo inválido → 422 ValidationError en vez de dejar que Prisma crashee con 500
  throw new ValidationError(`Invalid order_by field: '${orderBy}'. Allowed: createdAt, updatedAt, likesCount`)
}

function buildPagination (params?: BaseQueryParams): { skip: number, take: number } {
  const page = params?.page ?? DEFAULT_PAGE
  const limit = params?.limit ?? DEFAULT_LIMIT
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

function mapFact (fact: { id: string, authorId: string, title: string | null, content: string, createdAt: Date, updatedAt: Date }): Fact {
  return {
    id: fact.id,
    authorId: fact.authorId,
    title: fact.title,
    content: fact.content,
    createdAt: fact.createdAt,
    updatedAt: fact.updatedAt
  }
}

export class PrismaFactRepository implements FactRepository {
  async findById (id: string): Promise<Fact | null> {
    const fact = await prisma.fact.findUnique({
      where: { id }
    })

    if (fact == null) return null
    return mapFact(fact)
  }

  async findByAuthorId (authorId: string, params?: BaseQueryParams): Promise<ResultWithPagination<Fact>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        where: { authorId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.fact.count({ where: { authorId } })
    ])

    return buildPaginatedResult(facts.map(mapFact), total, page, limit)
  }

  async findAll (params?: BaseQueryParams): Promise<ResultWithPagination<Fact>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.fact.count()
    ])

    return buildPaginatedResult(facts.map(mapFact), total, page, limit)
  }

  async findPopular (params?: BaseQueryParams): Promise<ResultWithPagination<Fact>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        include: {
          _count: {
            select: { likes: true }
          }
        },
        orderBy: {
          likes: {
            _count: params?.order_dir === 'asc' ? 'asc' : 'desc'
          }
        },
        skip,
        take
      }),
      prisma.fact.count()
    ])

    return buildPaginatedResult(facts.map(mapFact), total, page, limit)
  }

  async create (data: CreateFactData): Promise<Fact> {
    const fact = await prisma.fact.create({
      data: {
        authorId: data.authorId,
        title: data.title ?? null,
        content: data.content
      }
    })

    return mapFact(fact)
  }

  async update (id: string, data: UpdateFactData): Promise<Fact> {
    const fact = await prisma.fact.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content
      }
    })

    return mapFact(fact)
  }

  async delete (id: string): Promise<void> {
    await prisma.fact.delete({
      where: { id }
    })
  }
}
