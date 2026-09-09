import prisma from '@shared/infrastructure/prisma'
import { type Fact, type CreateFactData, type UpdateFactData } from '../../domain/entities/Fact'
import { type FactRepository, type FeedPaginationEntry } from '../../domain/ports/FactRepository'
import { type FactView } from '../../domain/models/FactView'
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { type CommentPreview } from '@comments/application/dto/CommentPreview'
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
  const result = new Map<string, number>()
  for (const l of likeCounts) {
    if (l.factId != null) result.set(l.factId, l._count.factId)
  }
  return result
}

async function batchUserLikes (factIds: string[], viewerId: string): Promise<Set<string>> {
  if (factIds.length === 0) return new Set()
  const userLikes = await prisma.like.findMany({
    where: { factId: { in: factIds }, userId: viewerId },
    select: { factId: true }
  })
  return new Set(userLikes.map(l => l.factId).filter((id): id is string => id != null))
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

async function batchCommentCounts (factIds: string[]): Promise<Map<string, number>> {
  if (factIds.length === 0) return new Map()
  const rows = await prisma.comment.groupBy({
    by: ['factId'],
    _count: { factId: true },
    where: { factId: { in: factIds } }
  })
  const result = new Map<string, number>()
  for (const r of rows) {
    if (r.factId != null) result.set(r.factId, r._count.factId)
  }
  return result
}

async function batchRecentLikers (factIds: string[], limit: number = 3): Promise<Map<string, UserAvatarPreview[]>> {
  if (factIds.length === 0) return new Map()
  const likes = await prisma.like.findMany({
    where: { factId: { in: factIds } },
    orderBy: [{ factId: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    include: { user: { select: { username: true, avatarUrl: true, avatarColor: true } } }
  })
  const result = new Map<string, UserAvatarPreview[]>()
  for (const like of likes) {
    const fid = like.factId
    if (fid == null) continue
    const arr = result.get(fid) ?? []
    if (arr.length < limit) {
      arr.push({
        username: like.user.username,
        avatarUrl: like.user.avatarUrl,
        avatarColor: like.user.avatarColor
      })
      result.set(fid, arr)
    }
  }
  return result
}

async function batchFirstComment (factIds: string[]): Promise<Map<string, CommentPreview | null>> {
  if (factIds.length === 0) return new Map()
  const comments = await prisma.comment.findMany({
    where: { factId: { in: factIds }, parentCommentId: null },
    orderBy: [{ factId: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    include: { author: { select: { username: true, avatarUrl: true, avatarColor: true } } }
  })

  const picked = new Map<string, { id: string, content: string, author: UserAvatarPreview, createdAt: Date }>()
  for (const c of comments) {
    const fid = c.factId
    if (fid == null) continue
    if (!picked.has(fid)) {
      picked.set(fid, {
        id: c.id,
        content: c.content,
        author: {
          username: c.author.username,
          avatarUrl: c.author.avatarUrl,
          avatarColor: c.author.avatarColor
        },
        createdAt: c.createdAt
      })
    }
  }

  if (picked.size === 0) return new Map()

  const pickedIds = [...picked.values()].map(p => p.id)
  const replyRows = await prisma.comment.groupBy({
    by: ['parentCommentId'],
    _count: { parentCommentId: true },
    where: { parentCommentId: { in: pickedIds } }
  })
  const replyCountMap = new Map<string, number>()
  for (const row of replyRows) {
    if (row.parentCommentId == null) continue
    replyCountMap.set(row.parentCommentId, row._count.parentCommentId)
  }

  const result = new Map<string, CommentPreview | null>()
  for (const [factId, c] of picked) {
    result.set(factId, {
      id: c.id,
      content: c.content,
      author: c.author,
      parentCommentId: null,
      replies: replyCountMap.get(c.id) ?? 0,
      createdAt: c.createdAt.toISOString()
    })
  }
  return result
}

async function batchCommentsDetailsForMention (
  factIds: string[],
  authorIds: string[],
  usernames: string[],
  query: string
): Promise<Map<string, CommentPreview | null>> {
  if (factIds.length === 0) return new Map()

  const commentOrConditions: Array<Record<string, unknown>> = []

  if (authorIds.length > 0) {
    commentOrConditions.push({ mentions: { some: { mentionedUserId: { in: authorIds } } } })
  }

  for (const username of usernames) {
    commentOrConditions.push({ content: { contains: `@${username}`, mode: 'insensitive' } })
  }

  if (authorIds.length === 0) {
    commentOrConditions.push({ content: { contains: `@${query}`, mode: 'insensitive' } })
  }

  const matchingComments = await prisma.comment.findMany({
    where: {
      factId: { in: factIds },
      OR: commentOrConditions
    },
    orderBy: [{ factId: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    include: {
      author: { select: { username: true, avatarUrl: true, avatarColor: true } }
    }
  })

  const missingFactIds = factIds.filter(fid => !matchingComments.some(c => c.factId === fid))
  let repostMatchingComments: Array<{
    id: string
    content: string
    parentCommentId: string | null
    createdAt: Date
    author: { username: string, avatarUrl: string | null, avatarColor: string | null }
    repost: { originalFactId: string } | null
  }> = []

  if (missingFactIds.length > 0) {
    repostMatchingComments = await prisma.comment.findMany({
      where: {
        repost: { originalFactId: { in: missingFactIds } },
        OR: commentOrConditions
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: {
        author: { select: { username: true, avatarUrl: true, avatarColor: true } },
        repost: { select: { originalFactId: true } }
      }
    })
  }

  const picked = new Map<string, { id: string, content: string, parentCommentId: string | null, author: UserAvatarPreview, createdAt: Date }>()

  for (const c of matchingComments) {
    const fid = c.factId
    if (fid == null) continue
    if (!picked.has(fid)) {
      picked.set(fid, {
        id: c.id,
        content: c.content,
        parentCommentId: c.parentCommentId,
        author: {
          username: c.author.username,
          avatarUrl: c.author.avatarUrl,
          avatarColor: c.author.avatarColor
        },
        createdAt: c.createdAt
      })
    }
  }

  for (const c of repostMatchingComments) {
    const fid = c.repost?.originalFactId
    if (fid == null) continue
    if (!picked.has(fid)) {
      picked.set(fid, {
        id: c.id,
        content: c.content,
        parentCommentId: c.parentCommentId,
        author: {
          username: c.author.username,
          avatarUrl: c.author.avatarUrl,
          avatarColor: c.author.avatarColor
        },
        createdAt: c.createdAt
      })
    }
  }

  const remainingFactIds = factIds.filter(fid => !picked.has(fid))
  const fallbackMap = remainingFactIds.length > 0 ? await batchFirstComment(remainingFactIds) : new Map<string, CommentPreview | null>()

  const topLevelPickedIds = [...picked.values()].filter(p => p.parentCommentId === null).map(p => p.id)
  const replyCountMap = new Map<string, number>()
  if (topLevelPickedIds.length > 0) {
    const replyRows = await prisma.comment.groupBy({
      by: ['parentCommentId'],
      _count: { parentCommentId: true },
      where: { parentCommentId: { in: topLevelPickedIds } }
    })
    for (const row of replyRows) {
      if (row.parentCommentId == null) continue
      replyCountMap.set(row.parentCommentId, row._count.parentCommentId)
    }
  }

  const result = new Map<string, CommentPreview | null>()
  for (const [factId, c] of picked) {
    result.set(factId, {
      id: c.id,
      content: c.content,
      author: c.author,
      parentCommentId: c.parentCommentId,
      replies: c.parentCommentId === null ? (replyCountMap.get(c.id) ?? 0) : 0,
      createdAt: c.createdAt.toISOString()
    })
  }

  for (const [factId, preview] of fallbackMap) {
    result.set(factId, preview)
  }

  return result
}

async function batchRepostCounts (factIds: string[]): Promise<Map<string, number>> {
  if (factIds.length === 0) return new Map()
  const rows = await prisma.repost.groupBy({
    by: ['originalFactId'],
    _count: { originalFactId: true },
    where: { originalFactId: { in: factIds } }
  })
  return new Map(rows.map(r => [r.originalFactId, r._count.originalFactId]))
}

async function batchRecentReposters (factIds: string[], limit: number = 2): Promise<Map<string, UserAvatarPreview[]>> {
  if (factIds.length === 0) return new Map()
  const reposts = await prisma.repost.findMany({
    where: { originalFactId: { in: factIds } },
    orderBy: [{ originalFactId: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    include: { author: { select: { username: true, avatarUrl: true, avatarColor: true } } }
  })
  const result = new Map<string, UserAvatarPreview[]>()
  for (const repost of reposts) {
    const arr = result.get(repost.originalFactId) ?? []
    if (arr.length < limit) {
      arr.push({
        username: repost.author.username,
        avatarUrl: repost.author.avatarUrl,
        avatarColor: repost.author.avatarColor
      })
      result.set(repost.originalFactId, arr)
    }
  }
  return result
}

async function batchViewerRepostedSet (factIds: string[], viewerId: string): Promise<Set<string>> {
  if (factIds.length === 0) return new Set()
  const userReposts = await prisma.repost.findMany({
    where: { originalFactId: { in: factIds }, authorId: viewerId },
    select: { originalFactId: true }
  })
  return new Set(userReposts.map(r => r.originalFactId))
}

function enrichFact (
  fact: { id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date },
  likeCountMap: Map<string, number>,
  commentCountMap: Map<string, number>,
  likeByMap: Map<string, UserAvatarPreview[]>,
  commentsDetailsMap: Map<string, CommentPreview | null>,
  repostCountMap: Map<string, number>,
  repostByMap: Map<string, UserAvatarPreview[]>,
  viewerLikedSet: Set<string> | null,
  viewerRepostedSet: Set<string> | null,
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
    likeBy: likeByMap.get(fact.id) ?? [],
    comments: commentCountMap.get(fact.id) ?? 0,
    commentsDetails: commentsDetailsMap.get(fact.id) ?? null,
    repostCount: repostCountMap.get(fact.id) ?? 0,
    repostBy: repostByMap.get(fact.id) ?? [],
    hashtags,
    createdAt: fact.createdAt,
    updatedAt: fact.updatedAt
  }
  if (viewerId !== null && viewerLikedSet !== null && viewerRepostedSet !== null) {
    return {
      ...base,
      liked: viewerLikedSet.has(fact.id),
      repostedByMe: viewerRepostedSet.has(fact.id)
    }
  }
  return base
}

async function enrichFacts (
  facts: Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>,
  likeCountMap: Map<string, number>,
  commentCountMap: Map<string, number>,
  likeByMap: Map<string, UserAvatarPreview[]>,
  commentsDetailsMap: Map<string, CommentPreview | null>,
  repostCountMap: Map<string, number>,
  repostByMap: Map<string, UserAvatarPreview[]>,
  viewerId: string | null,
  hashtagsMap: Map<string, Array<{ id: string, tag: string }>>
): Promise<FactView[]> {
  if (facts.length === 0) return []
  const factIds = facts.map(f => f.id)
  const [viewerLikedSet, viewerRepostedSet] = viewerId !== null
    ? await Promise.all([
      batchUserLikes(factIds, viewerId),
      batchViewerRepostedSet(factIds, viewerId)
    ])
    : [null, null]
  return facts.map(f => enrichFact(
    f, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap,
    repostCountMap, repostByMap,
    viewerLikedSet, viewerRepostedSet, viewerId,
    hashtagsMap.get(f.id) ?? []
  ))
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

    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerLikedSet, viewerRepostedSet, hashtagsMap] = await Promise.all([
      batchLikeCounts([id]),
      batchCommentCounts([id]),
      batchRecentLikers([id], 3),
      batchFirstComment([id]),
      batchRepostCounts([id]),
      batchRecentReposters([id], 2),
      viewerId !== undefined ? batchUserLikes([id], viewerId) : null,
      viewerId !== undefined ? batchViewerRepostedSet([id], viewerId) : null,
      batchHashtags([id])
    ])

    return enrichFact(
      fact,
      likeCountMap,
      commentCountMap,
      likeByMap,
      commentsDetailsMap,
      repostCountMap,
      repostByMap,
      viewerLikedSet,
      viewerRepostedSet,
      viewerId ?? null,
      hashtagsMap.get(id) ?? []
    )
  }

  async findByIds (ids: string[], viewerId?: string): Promise<FactView[]> {
    if (ids.length === 0) return []

    const facts = await prisma.fact.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        authorId: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
      }
    })

    if (facts.length === 0) return []

    const factIds = facts.map(f => f.id)
    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchFirstComment(factIds),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])
    const enriched = await enrichFacts(facts, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerId ?? null, hashtagsMap)

    return enriched
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

    const factIds = facts.map(f => f.id)
    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchFirstComment(factIds),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])
    const enriched = await enrichFacts(facts, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerId ?? null, hashtagsMap)

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

    const factIds = facts.map(f => f.id)
    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchFirstComment(factIds),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])
    const enriched = await enrichFacts(facts, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerId ?? null, hashtagsMap)

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

    const factIds = facts.map(f => f.id)
    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchFirstComment(factIds),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])
    const enriched = await enrichFacts(facts, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerId ?? null, hashtagsMap)

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

    const factIds = facts.map(f => f.id)
    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchFirstComment(factIds),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])
    const enriched = await enrichFacts(facts, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerId ?? null, hashtagsMap)

    return buildPaginatedResult(enriched, total, page, limit)
  }

  async findByAuthorOrMention (query: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? 10
    const { skip, take } = buildPagination(params)

    const normalizedQuery = query.startsWith('@') ? query.slice(1) : query

    // Find users matching the query to get their firebaseUid
    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: normalizedQuery, mode: 'insensitive' } },
          { displayName: { contains: normalizedQuery, mode: 'insensitive' } }
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
          tag: { contains: normalizedQuery, mode: 'insensitive' }
        }
      },
      select: { factId: true },
      distinct: ['factId']
    })
    const hashtagFactIds = matchingHashtags.map(fh => fh.factId)

    // Build OR conditions: authorId matches OR content contains @username OR hashtag matches OR mentioned in comments
    const orConditions: Array<Record<string, unknown>> = []

    if (authorIds.length > 0) {
      // 1. User is author of the fact
      orConditions.push({ authorId: { in: authorIds } })
      // 2. User is directly mentioned on the fact
      orConditions.push({ mentions: { some: { mentionedUserId: { in: authorIds } } } })
      // 3. User is mentioned in comments on the fact
      orConditions.push({ comments: { some: { mentions: { some: { mentionedUserId: { in: authorIds } } } } } })
      // 4. User is mentioned in comments on reposts of the fact
      orConditions.push({ reposts: { some: { comments: { some: { mentions: { some: { mentionedUserId: { in: authorIds } } } } } } } })
    }

    // For mentions, we search for @username patterns in fact and comment content
    for (const username of usernames) {
      orConditions.push({ content: { contains: `@${username}`, mode: 'insensitive' } })
      orConditions.push({ comments: { some: { content: { contains: `@${username}`, mode: 'insensitive' } } } })
      orConditions.push({ reposts: { some: { comments: { some: { content: { contains: `@${username}`, mode: 'insensitive' } } } } } })
    }

    // If no users matched, also try direct content mention search with the raw query
    if (authorIds.length === 0) {
      orConditions.push({ content: { contains: `@${normalizedQuery}`, mode: 'insensitive' } })
      orConditions.push({ comments: { some: { content: { contains: `@${normalizedQuery}`, mode: 'insensitive' } } } })
      orConditions.push({ reposts: { some: { comments: { some: { content: { contains: `@${normalizedQuery}`, mode: 'insensitive' } } } } } })
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

    const factIds = facts.map(f => f.id)
    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchCommentsDetailsForMention(factIds, authorIds, usernames, normalizedQuery),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])
    const enriched = await enrichFacts(facts, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerId ?? null, hashtagsMap)

    return buildPaginatedResult(enriched, total, page, limit)
  }

  async findByHashtag (tag: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams): Promise<ResultWithPagination<FactView>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? 10
    const { skip, take } = buildPagination(params)

    // Find all hashtags matching the tag prefix (startsWith for autocomplete feel)
    const matchingHashtags = await prisma.hashtag.findMany({
      where: { tag: { startsWith: tag.toLowerCase() } },
      select: { id: true }
    })

    if (matchingHashtags.length === 0) {
      return buildPaginatedResult([], 0, page, limit)
    }

    const hashtagIds = matchingHashtags.map(h => h.id)

    // Find all fact IDs that use any of these hashtags
    const factHashtags = await prisma.factHashtag.findMany({
      where: { hashtagId: { in: hashtagIds } },
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

    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchFirstComment(factIds),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])
    const enriched = await enrichFacts(facts, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, viewerId ?? null, hashtagsMap)

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

  // ─── Batch optimization methods ───────────────────────────────────────────

  private readonly FACT_SELECT = {
    id: true,
    authorId: true,
    title: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    author: { select: { firebaseUid: true, username: true, email: true, displayName: true, avatarUrl: true, avatarColor: true } }
  } as const

  async findRawByIds (ids: string[]): Promise<Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>> {
    if (ids.length === 0) return []
    return await prisma.fact.findMany({
      where: { id: { in: ids } },
      select: this.FACT_SELECT
    })
  }

  async findRawAll (params?: BaseQueryParams): Promise<{ facts: Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>, total: number }> {
    const { skip, take } = buildPagination(params)

    const [facts, total] = await Promise.all([
      prisma.fact.findMany({
        select: this.FACT_SELECT,
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.fact.count()
    ])

    return { facts, total }
  }

  async batchBuildEnrichmentMaps (factIds: string[]): Promise<import('../../domain/ports/FactRepository').EnrichmentMaps> {
    if (factIds.length === 0) {
      return {
        likeCountMap: new Map(),
        commentCountMap: new Map(),
        likeByMap: new Map(),
        commentsDetailsMap: new Map(),
        repostCountMap: new Map(),
        repostByMap: new Map(),
        hashtagsMap: new Map()
      }
    }

    const [likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap] = await Promise.all([
      batchLikeCounts(factIds),
      batchCommentCounts(factIds),
      batchRecentLikers(factIds, 3),
      batchFirstComment(factIds),
      batchRepostCounts(factIds),
      batchRecentReposters(factIds, 2),
      batchHashtags(factIds)
    ])

    return { likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap }
  }

  async batchEnrichFacts (
    facts: Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>,
    enrichmentMaps: import('../../domain/ports/FactRepository').EnrichmentMaps,
    viewerId?: string
  ): Promise<FactView[]> {
    if (facts.length === 0) return []

    const factIds = facts.map(f => f.id)
    const { likeCountMap, commentCountMap, likeByMap, commentsDetailsMap, repostCountMap, repostByMap, hashtagsMap } = enrichmentMaps

    const [viewerLikedSet, viewerRepostedSet] = viewerId != null
      ? await Promise.all([
        batchUserLikes(factIds, viewerId),
        batchViewerRepostedSet(factIds, viewerId)
      ])
      : [null, null]

    return facts.map(f => enrichFact(
      f, likeCountMap, commentCountMap, likeByMap, commentsDetailsMap,
      repostCountMap, repostByMap,
      viewerLikedSet, viewerRepostedSet,
      viewerId ?? null,
      hashtagsMap.get(f.id) ?? []
    ))
  }

  async batchViewerContext (factIds: string[], viewerId: string): Promise<{ viewerLikedSet: Set<string>, viewerRepostedSet: Set<string> }> {
    if (factIds.length === 0) return { viewerLikedSet: new Set(), viewerRepostedSet: new Set() }
    const [viewerLikedSet, viewerRepostedSet] = await Promise.all([
      batchUserLikes(factIds, viewerId),
      batchViewerRepostedSet(factIds, viewerId)
    ])
    return { viewerLikedSet, viewerRepostedSet }
  }

  async findFeedPagination (params: { skip: number, take: number }): Promise<FeedPaginationEntry[]> {
    return await prisma.viewFactsRepostPagination.findMany({
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take
    })
  }

  async findAuthorFeedPagination (authorId: string, params: { skip: number, take: number }): Promise<FeedPaginationEntry[]> {
    return await prisma.viewFactsRepostPagination.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take
    })
  }

  async findFactIdsByQuery (query: string): Promise<string[]> {
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

    const facts = await prisma.fact.findMany({
      where,
      select: { id: true }
    })
    return facts.map(f => f.id)
  }

  async findFactIdsByHashtag (tag: string): Promise<string[]> {
    const matchingHashtags = await prisma.hashtag.findMany({
      where: { tag: { startsWith: tag.toLowerCase() } },
      select: { id: true }
    })
    if (matchingHashtags.length === 0) return []

    const hashtagIds = matchingHashtags.map(h => h.id)
    const factHashtags = await prisma.factHashtag.findMany({
      where: { hashtagId: { in: hashtagIds } },
      select: { factId: true }
    })
    return factHashtags.map(fh => fh.factId)
  }

  async findMentionSearchTargets (query: string): Promise<{ authorIds: string[], factIds: string[] }> {
    const normalizedQuery = query.startsWith('@') ? query.slice(1) : query

    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: normalizedQuery, mode: 'insensitive' } },
          { displayName: { contains: normalizedQuery, mode: 'insensitive' } }
        ]
      },
      select: { firebaseUid: true, username: true },
      take: 10
    })

    const authorIds = matchingUsers.map(u => u.firebaseUid)
    const usernames = matchingUsers.map(u => u.username)

    const matchingHashtags = await prisma.factHashtag.findMany({
      where: {
        hashtag: {
          tag: { contains: normalizedQuery, mode: 'insensitive' }
        }
      },
      select: { factId: true },
      distinct: ['factId']
    })
    const hashtagFactIds = matchingHashtags.map(fh => fh.factId)

    const orConditions: Array<Record<string, unknown>> = []

    if (authorIds.length > 0) {
      orConditions.push({ authorId: { in: authorIds } })
      orConditions.push({ mentions: { some: { mentionedUserId: { in: authorIds } } } })
      orConditions.push({ comments: { some: { mentions: { some: { mentionedUserId: { in: authorIds } } } } } })
      orConditions.push({ reposts: { some: { comments: { some: { mentions: { some: { mentionedUserId: { in: authorIds } } } } } } } })
    }

    for (const username of usernames) {
      orConditions.push({ content: { contains: `@${username}`, mode: 'insensitive' } })
      orConditions.push({ comments: { some: { content: { contains: `@${username}`, mode: 'insensitive' } } } })
      orConditions.push({ reposts: { some: { comments: { some: { content: { contains: `@${username}`, mode: 'insensitive' } } } } } })
    }

    if (authorIds.length === 0) {
      orConditions.push({ content: { contains: `@${normalizedQuery}`, mode: 'insensitive' } })
      orConditions.push({ comments: { some: { content: { contains: `@${normalizedQuery}`, mode: 'insensitive' } } } })
      orConditions.push({ reposts: { some: { comments: { some: { content: { contains: `@${normalizedQuery}`, mode: 'insensitive' } } } } } })
    }

    if (hashtagFactIds.length > 0) {
      orConditions.push({ id: { in: hashtagFactIds } })
    }

    const facts = await prisma.fact.findMany({
      where: { OR: orConditions },
      select: { id: true }
    })

    return {
      authorIds,
      factIds: facts.map(f => f.id)
    }
  }

  async findFeedPaginationByFactIds (factIds: string[], params: { skip: number, take: number }): Promise<FeedPaginationEntry[]> {
    if (factIds.length === 0) return []
    return await prisma.viewFactsRepostPagination.findMany({
      where: { originalFactId: { in: factIds } },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take
    })
  }

  async findFeedPaginationByAuthorsOrFactIds (authorIds: string[], factIds: string[], params: { skip: number, take: number }): Promise<FeedPaginationEntry[]> {
    const orConditions: Array<Record<string, unknown>> = []
    if (authorIds.length > 0) {
      orConditions.push({ authorId: { in: authorIds } })
    }
    if (factIds.length > 0) {
      orConditions.push({ originalFactId: { in: factIds } })
    }
    if (orConditions.length === 0) return []

    return await prisma.viewFactsRepostPagination.findMany({
      where: { OR: orConditions },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take
    })
  }
}
