import prisma from '@shared/infrastructure/prisma'
import { type Fact, type CreateFactData, type UpdateFactData } from '../../domain/entities/Fact'
import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactView } from '../../domain/models/FactView'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'
import { ValidationError } from '@shared/domain/errors/ValidationError'

function buildOrderBy (orderBy?: string, orderDir?: string): Record<string, unknown> {
  if (orderBy == null) return { createdAt: 'desc' }
  const dir: 'asc' | 'desc' = orderDir === 'asc' ? 'asc' : 'desc'

  const validFields = ['createdAt', 'updatedAt', 'authorId']
  if (validFields.includes(orderBy)) {
    return { [orderBy]: dir }
  }

  if (orderBy === 'likesCount') {
    return { likes: { _count: dir } }
  }

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

async function batchLikeCounts (factIds: string[]): Promise<Map<string, number>> {
  if (factIds.length === 0) return new Map()
  const likeCounts = await prisma.like.groupBy({
    by: ['factId'],
    _count: { factId: true },
    where: { factId: { in: factIds } }
  })
  return new Map(likeCounts.map(l => [l.factId, l._count.factId]))
}

async function batchUserLikes (factIds: string[], viewerId: string): Promise<Set<string>> {
  if (factIds.length === 0) return new Set()
  const userLikes = await prisma.like.findMany({
    where: { factId: { in: factIds }, userId: viewerId },
    select: { factId: true }
  })
  return new Set(userLikes.map(l => l.factId))
}

function enrichFact (
  fact: { id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string }, title: string | null, content: string, createdAt: Date, updatedAt: Date },
  likeCountMap: Map<string, number>,
  viewerLikedSet: Set<string> | null,
  viewerId: string | null
): FactView {
  const base = {
    id: fact.id,
    authorId: fact.authorId,
    author: {
      id: fact.author.firebaseUid,
      username: fact.author.username,
      email: fact.author.email,
      displayName: fact.author.displayName
    },
    title: fact.title,
    content: fact.content,
    likes: likeCountMap.get(fact.id) ?? 0,
    createdAt: fact.createdAt,
    updatedAt: fact.updatedAt
  }
  if (viewerId !== null && viewerLikedSet !== null) {
    return { ...base, liked: viewerLikedSet.has(fact.id) }
  }
  return base
}

async function enrichFacts (
  facts: Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>,
  likeCountMap: Map<string, number>,
  viewerId: string | null
): Promise<FactView[]> {
  if (facts.length === 0) return []
  const viewerLikedSet = viewerId !== null ? await batchUserLikes(facts.map(f => f.id), viewerId) : null
  return facts.map(f => enrichFact(f, likeCountMap, viewerLikedSet, viewerId))
}

export class PrismaFactRepository implements FactRepository {
  async findById (id: string, viewerId?: string): Promise<FactView | null> {
    const fact = await prisma.fact.findUnique({
      where: { id },
      include: {
        author: { select: { firebaseUid: true, username: true, email: true, displayName: true } }
      }
    })

    if (fact == null) return null

    const [likeCountMap, viewerLikedSet] = await Promise.all([
      batchLikeCounts([id]),
      viewerId !== undefined ? batchUserLikes([id], viewerId) : null
    ])

    return enrichFact(
      fact,
      likeCountMap,
      viewerLikedSet,
      viewerId ?? null
    )
  }

  async findByAuthorId (authorId: string, params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)

    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        where: { authorId },
        select: {
          id: true,
          authorId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true } }
        },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.fact.count({ where: { authorId } })
    ])

    if (facts.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    const likeCountMap = await batchLikeCounts(facts.map(f => f.id))
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null)

    return buildPaginatedResult(enriched, total, page, limit)
  }

  async findAll (params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)

    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        select: {
          id: true,
          authorId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true } }
        },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.fact.count()
    ])

    if (facts.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    const likeCountMap = await batchLikeCounts(facts.map(f => f.id))
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null)

    return buildPaginatedResult(enriched, total, page, limit)
  }

  async findPopular (params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)

    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        select: {
          id: true,
          authorId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true } }
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

    if (facts.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    const likeCountMap = await batchLikeCounts(facts.map(f => f.id))
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null)

    return buildPaginatedResult(enriched, total, page, limit)
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
