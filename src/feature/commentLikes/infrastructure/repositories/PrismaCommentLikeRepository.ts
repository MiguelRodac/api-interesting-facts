import prisma from '@shared/infrastructure/prisma'
import { type CommentLike } from '../../domain/entities/CommentLike'
import { type CommentLikeWithUser } from '../../domain/models/CommentLikeWithUser'
import { type CommentLikeRepository } from '../../domain/ports/CommentLikeRepository'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'
import { ValidationError } from '@shared/domain/errors/ValidationError'

function buildOrderBy (orderBy?: string, orderDir?: string): Record<string, unknown> {
  if (orderBy == null) return { createdAt: 'desc' }
  const dir: 'asc' | 'desc' = orderDir === 'asc' ? 'asc' : 'desc'

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

function mapCommentLike (like: { id: string, userId: string, commentId: string, createdAt: Date }): CommentLike {
  return {
    id: like.id,
    userId: like.userId,
    commentId: like.commentId,
    createdAt: like.createdAt
  }
}

function mapCommentLikeWithUser (like: {
  id: string
  userId: string
  commentId: string
  createdAt: Date
  user: { username: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
}): CommentLikeWithUser {
  return {
    id: like.id,
    userId: like.userId,
    commentId: like.commentId,
    createdAt: like.createdAt,
    username: like.user.username,
    displayName: like.user.displayName,
    avatarUrl: like.user.avatarUrl,
    avatarColor: like.user.avatarColor
  }
}

export class PrismaCommentLikeRepository implements CommentLikeRepository {
  async findByUserAndComment (userId: string, commentId: string): Promise<CommentLike | null> {
    const like = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId }
      }
    })

    if (like == null) return null
    return mapCommentLike(like)
  }

  async findByCommentId (commentId: string, params?: BaseQueryParams): Promise<ResultWithPagination<CommentLikeWithUser>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const [likes, total] = await Promise.all([
      prisma.commentLike.findMany({
        where: { commentId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take,
        include: {
          user: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.commentLike.count({ where: { commentId } })
    ])

    return buildPaginatedResult(likes.map(mapCommentLikeWithUser), total, page, limit)
  }

  async create (userId: string, commentId: string): Promise<CommentLike> {
    const like = await prisma.commentLike.create({
      data: {
        userId,
        commentId
      }
    })

    return mapCommentLike(like)
  }

  async delete (userId: string, commentId: string): Promise<void> {
    await prisma.commentLike.delete({
      where: {
        commentId_userId: { commentId, userId }
      }
    })
  }
}
