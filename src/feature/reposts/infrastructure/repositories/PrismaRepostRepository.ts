import prisma from '@shared/infrastructure/prisma'
import { type Repost } from '../../domain/entities/Repost'
import { type RepostWithUser } from '../../domain/models/RepostWithUser'
import { type RepostWithFact } from '../../domain/models/RepostWithFact'
import { type RepostRepository } from '../../domain/ports/RepostRepository'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'
import { ValidationError } from '@shared/domain/errors/ValidationError'

function buildOrderBy (orderBy?: string, orderDir?: string): Record<string, unknown> {
  if (orderBy == null) return { createdAt: 'desc' }
  const dir: 'asc' | 'desc' = orderDir === 'asc' ? 'asc' : 'desc'

  // Solo createdAt es válido para reposts
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

function mapRepost (repost: { id: string, originalFactId: string, authorId: string, createdAt: Date }): Repost {
  return {
    id: repost.id,
    originalFactId: repost.originalFactId,
    authorId: repost.authorId,
    createdAt: repost.createdAt
  }
}

function mapRepostWithUser (repost: {
  id: string
  originalFactId: string
  authorId: string
  createdAt: Date
  author: { username: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
}): RepostWithUser {
  return {
    id: repost.id,
    originalFactId: repost.originalFactId,
    authorId: repost.authorId,
    createdAt: repost.createdAt,
    username: repost.author.username,
    displayName: repost.author.displayName,
    avatarUrl: repost.author.avatarUrl,
    avatarColor: repost.author.avatarColor
  }
}

function mapRepostWithFact (repost: {
  id: string
  originalFactId: string
  authorId: string
  createdAt: Date
  author: { username: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
}): RepostWithFact {
  return {
    id: repost.id,
    originalFactId: repost.originalFactId,
    authorId: repost.authorId,
    createdAt: repost.createdAt,
    username: repost.author.username,
    displayName: repost.author.displayName,
    avatarUrl: repost.author.avatarUrl,
    avatarColor: repost.author.avatarColor
  }
}

export class PrismaRepostRepository implements RepostRepository {
  async findByAuthorAndFact (authorId: string, originalFactId: string): Promise<Repost | null> {
    const repost = await prisma.repost.findUnique({
      where: {
        authorId_originalFactId: { authorId, originalFactId }
      }
    })

    if (repost == null) return null
    return mapRepost(repost)
  }

  async findByFactId (originalFactId: string, params?: BaseQueryParams): Promise<ResultWithPagination<RepostWithUser>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [reposts, total] = await Promise.all([
      prisma.repost.findMany({
        where: { originalFactId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take,
        include: {
          author: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.repost.count({ where: { originalFactId } })
    ])

    return buildPaginatedResult(reposts.map(mapRepostWithUser), total, page, limit)
  }

  async findAllWithFact (params?: BaseQueryParams): Promise<ResultWithPagination<RepostWithFact>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [reposts, total] = await Promise.all([
      prisma.repost.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          author: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.repost.count()
    ])

    return buildPaginatedResult(reposts.map(mapRepostWithFact), total, page, limit)
  }

  async findByAuthorWithFact (authorId: string, params?: BaseQueryParams): Promise<ResultWithPagination<RepostWithFact>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [reposts, total] = await Promise.all([
      prisma.repost.findMany({
        where: { authorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          author: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.repost.count({ where: { authorId } })
    ])

    return buildPaginatedResult(reposts.map(mapRepostWithFact), total, page, limit)
  }

  async create (authorId: string, originalFactId: string): Promise<Repost> {
    const repost = await prisma.repost.create({
      data: {
        authorId,
        originalFactId
      }
    })

    return mapRepost(repost)
  }

  async delete (authorId: string, originalFactId: string): Promise<void> {
    await prisma.repost.delete({
      where: {
        authorId_originalFactId: { authorId, originalFactId }
      }
    })
  }
}
