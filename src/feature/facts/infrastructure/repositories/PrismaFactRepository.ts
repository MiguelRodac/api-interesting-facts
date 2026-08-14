import prisma from '@shared/infrastructure/prisma'
import { type Fact, type CreateFactData, type UpdateFactData } from '../../domain/entities/Fact'
import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactView } from '../../domain/models/FactView'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, type SearchOrderParams, buildPaginatedResult } from '@shared/domain/types/query-filters'
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

function buildSearchOrderBy (orderParams?: SearchOrderParams): Record<string, unknown> {
  const orderBy = orderParams?.order_by ?? 'popular'
  const dir: 'asc' | 'desc' = orderParams?.order_dir === 'asc' ? 'asc' : 'desc'

  if (orderBy === 'recent') {
    return { createdAt: dir }
  }

  // popular: order by likes count
  return { likes: { _count: dir } }
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

async function batchHashtags (factIds: string[]): Promise<Map<string, Array<{ id: string, tag: string }>>> {
  if (factIds.length === 0) return new Map()
  const factHashtags = await prisma.factHashtag.findMany({
    where: { factId: { in: factIds } },
    include: {
      hashtag: { select: { id: true, tag: true } }
    }
  })
  const result = new Map<string, Array<{ id: string, tag: string }>>()
  for (const fh of factHashtags) {
    const existing = result.get(fh.factId) ?? []
    existing.push({ id: fh.hashtag.id, tag: fh.hashtag.tag })
    result.set(fh.factId, existing)
  }
  return result
}

function enrichFact (
  fact: { id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date },
  likeCountMap: Map<string, number>,
  viewerLikedSet: Set<string> | null,
  viewerId: string | null,
  hashtags: Array<{ id: string, tag: string }> = []
): FactView {
  const base = {
    id: fact.id,
    authorId: fact.authorId,
    author: {
      id: fact.author.firebaseUid,
      username: fact.author.username,
      email: fact.author.email,
      displayName: fact.author.displayName,
      avatarUrl: fact.author.avatarUrl,
      avatarColor: fact.author.avatarColor
    },
    title: fact.title,
    content: fact.content,
    likes: likeCountMap.get(fact.id) ?? 0,
    hashtags,
    createdAt: fact.createdAt,
    updatedAt: fact.updatedAt
  }
  if (viewerId !== null && viewerLikedSet !== null) {
    return { ...base, liked: viewerLikedSet.has(fact.id) }
  }
  return base
}

async function enrichFacts (
  facts: Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>,
  likeCountMap: Map<string, number>,
  viewerId: string | null,
  hashtagsMap: Map<string, Array<{ id: string, tag: string }>>
): Promise<FactView[]> {
  if (facts.length === 0) return []
  const viewerLikedSet = viewerId !== null ? await batchUserLikes(facts.map(f => f.id), viewerId) : null
  return facts.map(f => enrichFact(f, likeCountMap, viewerLikedSet, viewerId, hashtagsMap.get(f.id) ?? []))
}

export class PrismaFactRepository implements FactRepository {
  async findById (id: string, viewerId?: string): Promise<FactView | null> {
    const fact = await prisma.fact.findUnique({
      where: { id },
      include: {
        author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
      }
    })

    if (fact == null) return null

    const [likeCountMap, viewerLikedSet, hashtagsMap] = await Promise.all([
      batchLikeCounts([id]),
      viewerId !== undefined ? batchUserLikes([id], viewerId) : null,
      batchHashtags([id])
    ])

    return enrichFact(
      fact,
      likeCountMap,
      viewerLikedSet,
      viewerId ?? null,
      hashtagsMap.get(id) ?? []
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
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
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

    const [likeCountMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(facts.map(f => f.id)),
      batchHashtags(facts.map(f => f.id))
    ])
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null, hashtagsMap)

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
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
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

    const [likeCountMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(facts.map(f => f.id)),
      batchHashtags(facts.map(f => f.id))
    ])
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null, hashtagsMap)

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
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
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

    const [likeCountMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(facts.map(f => f.id)),
      batchHashtags(facts.map(f => f.id))
    ])
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null, hashtagsMap)

    return buildPaginatedResult(enriched, total, page, limit)
  }

  async findByTitleOrHashtag (query: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? 10
    const { skip, take } = buildPagination(params)

    // Find fact IDs matching hashtag
    const matchingHashtags = await prisma.factHashtag.findMany({
      where: {
        hashtag: {
          tag: { contains: query, mode: 'insensitive' }
        }
      },
      select: { factId: true },
      distinct: ['factId']
    })
    const hashtagFactIds = matchingHashtags.map(fh => fh.factId)

    const where = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        ...(hashtagFactIds.length > 0 ? [{ id: { in: hashtagFactIds } }] : [])
      ]
    }

    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        where,
        select: {
          id: true,
          authorId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
        },
        orderBy: buildSearchOrderBy(orderParams),
        skip,
        take
      }),
      prisma.fact.count({ where })
    ])

    if (facts.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    const [likeCountMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(facts.map(f => f.id)),
      batchHashtags(facts.map(f => f.id))
    ])
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null, hashtagsMap)

    return buildPaginatedResult(enriched, total, page, limit)
  }

  async findByAuthorOrMention (query: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? 10
    const { skip, take } = buildPagination(params)

    // Find users matching the query to get their firebaseUid
    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: { firebaseUid: true, username: true },
      take: 10
    })

    const authorIds = matchingUsers.map(u => u.firebaseUid)
    const usernames = matchingUsers.map(u => u.username)

    // Find fact IDs matching hashtag via junction table
    const matchingHashtags = await prisma.factHashtag.findMany({
      where: {
        hashtag: {
          tag: { contains: query, mode: 'insensitive' }
        }
      },
      select: { factId: true },
      distinct: ['factId']
    })
    const hashtagFactIds = matchingHashtags.map(fh => fh.factId)

    // Build OR conditions: authorId matches OR content contains @username OR hashtag matches
    const orConditions: Array<Record<string, unknown>> = []

    if (authorIds.length > 0) {
      orConditions.push({ authorId: { in: authorIds } })
    }

    // For mentions, we search for @username patterns in content
    for (const username of usernames) {
      orConditions.push({ content: { contains: `@${username}`, mode: 'insensitive' } })
    }

    // If no users matched, also try a direct content mention search with the raw query
    if (orConditions.length === 0) {
      orConditions.push({ content: { contains: `@${query}`, mode: 'insensitive' } })
    }

    // Add hashtag cross-reference: facts linked to hashtags matching the query
    if (hashtagFactIds.length > 0) {
      orConditions.push({ id: { in: hashtagFactIds } })
    }

    const where = { OR: orConditions }

    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        where,
        select: {
          id: true,
          authorId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
        },
        orderBy: buildSearchOrderBy(orderParams),
        skip,
        take
      }),
      prisma.fact.count({ where })
    ])

    if (facts.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    const [likeCountMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(facts.map(f => f.id)),
      batchHashtags(facts.map(f => f.id))
    ])
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null, hashtagsMap)

    return buildPaginatedResult(enriched, total, page, limit)
  }

  async findByHashtag (tag: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? 10
    const { skip, take } = buildPagination(params)

    // Find hashtag by exact tag name
    const hashtag = await prisma.hashtag.findUnique({
      where: { tag: tag.toLowerCase() },
      select: { id: true }
    })

    if (hashtag == null) {
      return buildPaginatedResult([], 0, page, limit)
    }

    // Find all fact IDs that use this hashtag
    const factHashtags = await prisma.factHashtag.findMany({
      where: { hashtagId: hashtag.id },
      select: { factId: true }
    })
    const factIds = factHashtags.map(fh => fh.factId)

    if (factIds.length === 0) {
      return buildPaginatedResult([], 0, page, limit)
    }

    const where = { id: { in: factIds } }

    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        where,
        select: {
          id: true,
          authorId: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
        },
        orderBy: buildSearchOrderBy(orderParams),
        skip,
        take
      }),
      prisma.fact.count({ where })
    ])

    if (facts.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    const [likeCountMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(facts.map(f => f.id)),
      batchHashtags(facts.map(f => f.id))
    ])
    const enriched = await enrichFacts(facts, likeCountMap, viewerId ?? null, hashtagsMap)

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
