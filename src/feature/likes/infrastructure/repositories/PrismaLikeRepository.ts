import prisma from '@shared/infrastructure/prisma'
import { type Like } from '../../domain/entities/Like'
import { type LikeWithUser } from '../../domain/models/LikeWithUser'
import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'
import { ValidationError } from '@shared/domain/errors/ValidationError'

function buildOrderBy (orderBy?: string, orderDir?: string): Record<string, unknown> {
  if (orderBy == null) return { createdAt: 'desc' }
  const dir: 'asc' | 'desc' = orderDir === 'asc' ? 'asc' : 'desc'

  // Solo createdAt es válido para likes
  if (orderBy === 'createdAt') {
    return { createdAt: dir }
  }

  throw new ValidationError(`Invalid order_by field: '${orderBy}'. Allowed: createdAt`)
}

function buildPagination (params?: BaseQueryParams): { skip: number, take: number } {
  const page = params?.page ?? DEFAULT_PAGE
  const limit = params?.limit ?? DEFAULT_LIMIT
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

function mapLike (like: { id: string, userId: string, factId: string | null, repostId: string | null, createdAt: Date }): Like {
  return {
    id: like.id,
    userId: like.userId,
    factId: like.factId,
    repostId: like.repostId,
    createdAt: like.createdAt
  }
}

function mapLikeWithUser (like: {
  id: string
  userId: string
  factId: string | null
  repostId: string | null
  createdAt: Date
  user: { username: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
}): LikeWithUser {
  return {
    id: like.id,
    userId: like.userId,
    factId: like.factId,
    repostId: like.repostId,
    createdAt: like.createdAt,
    username: like.user.username,
    displayName: like.user.displayName,
    avatarUrl: like.user.avatarUrl,
    avatarColor: like.user.avatarColor
  }
}

export class PrismaLikeRepository implements LikeRepository {
  async findByUserAndFact (userId: string, factId: string): Promise<Like | null> {
    const like = await prisma.like.findFirst({
      where: { userId, factId }
    })

    if (like == null) return null
    return mapLike(like)
  }

  async findByFactId (factId: string, params?: BaseQueryParams): Promise<ResultWithPagination<LikeWithUser>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { factId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take,
        include: {
          user: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.like.count({ where: { factId } })
    ])

    return buildPaginatedResult(likes.map(mapLikeWithUser), total, page, limit)
  }

  async findByUserId (userId: string, params?: BaseQueryParams): Promise<ResultWithPagination<Like>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { userId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.like.count({ where: { userId } })
    ])

    return buildPaginatedResult(likes.map(mapLike), total, page, limit)
  }

  async create (userId: string, factId: string): Promise<Like> {
    const like = await prisma.like.create({
      data: {
        userId,
        factId
      }
    })

    return mapLike(like)
  }

  async delete (userId: string, factId: string): Promise<void> {
    await prisma.like.deleteMany({
      where: { userId, factId }
    })
  }

  async findByUserAndRepost (userId: string, repostId: string): Promise<Like | null> {
    const like = await prisma.like.findFirst({
      where: { userId, repostId }
    })

    if (like == null) return null
    return mapLike(like)
  }

  async findByRepostId (repostId: string, params?: BaseQueryParams): Promise<ResultWithPagination<LikeWithUser>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { repostId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take,
        include: {
          user: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.like.count({ where: { repostId } })
    ])

    return buildPaginatedResult(likes.map(mapLikeWithUser), total, page, limit)
  }

  async createRepostLike (userId: string, repostId: string): Promise<Like> {
    const like = await prisma.like.create({
      data: {
        userId,
        repostId
      }
    })

    return mapLike(like)
  }

  async deleteRepostLike (userId: string, repostId: string): Promise<void> {
    await prisma.like.deleteMany({
      where: { userId, repostId }
    })
  }

  async batchLikeCountsByRepostIds (repostIds: string[]): Promise<Map<string, number>> {
    if (repostIds.length === 0) return new Map()
    const likeCounts = await prisma.like.groupBy({
      by: ['repostId'],
      _count: { repostId: true },
      where: { repostId: { in: repostIds } }
    })
    const result = new Map<string, number>()
    for (const l of likeCounts) {
      if (l.repostId != null) result.set(l.repostId, l._count.repostId)
    }
    return result
  }

  async batchUserRepostLikes (repostIds: string[], viewerId: string): Promise<Set<string>> {
    if (repostIds.length === 0) return new Set()
    const userLikes = await prisma.like.findMany({
      where: { repostId: { in: repostIds }, userId: viewerId },
      select: { repostId: true }
    })
    return new Set(userLikes.map(l => l.repostId).filter((id): id is string => id != null))
  }

  async batchRecentRepostLikers (repostIds: string[], limit: number = 3): Promise<Map<string, UserAvatarPreview[]>> {
    if (repostIds.length === 0) return new Map()
    const likes = await prisma.like.findMany({
      where: { repostId: { in: repostIds } },
      orderBy: [{ repostId: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
      include: { user: { select: { username: true, avatarUrl: true, avatarColor: true } } }
    })
    const result = new Map<string, UserAvatarPreview[]>()
    for (const like of likes) {
      const rid = like.repostId
      if (rid == null) continue
      const arr = result.get(rid) ?? []
      if (arr.length < limit) {
        arr.push({
          username: like.user.username,
          avatarUrl: like.user.avatarUrl,
          avatarColor: like.user.avatarColor
        })
        result.set(rid, arr)
      }
    }
    return result
  }
}
