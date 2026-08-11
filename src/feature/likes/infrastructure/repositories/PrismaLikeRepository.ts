import prisma from '../../../../shared/infrastructure/prisma'
import { type Like } from '../../domain/entities/Like'
import { type LikeRepository, type PaginatedLikes } from '../../domain/ports/LikeRepository'
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

  async findByFactId (factId: string, params?: BaseQueryParams): Promise<PaginatedLikes> {
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

    return { items: likes.map(mapLike), total }
  }

  async findByUserId (userId: string, params?: BaseQueryParams): Promise<PaginatedLikes> {
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

    return { items: likes.map(mapLike), total }
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
