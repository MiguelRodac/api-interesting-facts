import prisma from '@shared/infrastructure/prisma'
import { type Like } from '../../domain/entities/Like'
import { type LikeRepository } from '../../domain/ports/LikeRepository'
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

function mapLike (like: { id: string, userId: string, factId: string, createdAt: Date }): Like {
  return {
    id: like.id,
    userId: like.userId,
    factId: like.factId,
    createdAt: like.createdAt
  }
}

export class PrismaLikeRepository implements LikeRepository {
  async findByUserAndFact (userId: string, factId: string): Promise<Like | null> {
    const like = await prisma.like.findUnique({
      where: {
        userId_factId: { userId, factId }
      }
    })

    if (like == null) return null
    return mapLike(like)
  }

  async findByFactId (factId: string, params?: BaseQueryParams): Promise<ResultWithPagination<Like>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { factId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take
      }),
      prisma.like.count({ where: { factId } })
    ])

    return buildPaginatedResult(likes.map(mapLike), total, page, limit)
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
    await prisma.like.delete({
      where: {
        userId_factId: { userId, factId }
      }
    })
  }
}
