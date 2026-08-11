import prisma from '../../../../shared/infrastructure/prisma'
import { type Fact, type CreateFactData, type UpdateFactData } from '../../domain/entities/Fact'
import { type FactRepository, type PaginatedFacts } from '../../domain/ports/FactRepository'
import { type BaseQueryParams } from '../../../../shared/domain/types/query-filters'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

function buildOrderBy (orderBy?: string, orderDir?: string): Record<string, 'asc' | 'desc'> {
  if (orderBy == null) return { createdAt: 'desc' }
  const dir: 'asc' | 'desc' = orderDir === 'asc' ? 'asc' : 'desc'
  return { [orderBy]: dir }
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

  async findByAuthorId (authorId: string, params?: BaseQueryParams): Promise<PaginatedFacts> {
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

    return { items: facts.map(mapFact), total }
  }

  async findAll (params?: BaseQueryParams): Promise<PaginatedFacts> {
    const { skip, take } = buildPagination(params)
    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.fact.count()
    ])

    return { items: facts.map(mapFact), total }
  }

  async findPopular (params?: BaseQueryParams): Promise<PaginatedFacts> {
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

    return { items: facts.map(mapFact), total }
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
