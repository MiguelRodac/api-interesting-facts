import prisma from '@shared/infrastructure/prisma'
import { type Comment } from '../../domain/entities/Comment'
import {
  type CommentRepository,
  type CommentWithAuthor,
  type CreateCommentData
} from '../../domain/ports/CommentRepository'
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  type BaseQueryParams,
  type ResultWithPagination,
  buildPaginatedResult
} from '@shared/domain/types/query-filters'
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

function mapComment (comment: {
  id: string
  content: string
  factId: string
  authorId: string
  parentCommentId: string | null
  createdAt: Date
  updatedAt: Date
}): Comment {
  return {
    id: comment.id,
    content: comment.content,
    factId: comment.factId,
    authorId: comment.authorId,
    parentCommentId: comment.parentCommentId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  }
}

function mapCommentWithAuthor (comment: {
  id: string
  content: string
  factId: string
  authorId: string
  parentCommentId: string | null
  createdAt: Date
  updatedAt: Date
  author: { username: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
  replies?: Array<{
    id: string
    content: string
    factId: string
    authorId: string
    parentCommentId: string | null
    createdAt: Date
    updatedAt: Date
    author: { username: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
  }>
}): CommentWithAuthor {
  return {
    id: comment.id,
    content: comment.content,
    factId: comment.factId,
    authorId: comment.authorId,
    parentCommentId: comment.parentCommentId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: comment.author,
    ...(comment.replies != null && { replies: comment.replies.map(mapCommentWithAuthor) })
  }
}

export class PrismaCommentRepository implements CommentRepository {
  async create (data: CreateCommentData): Promise<Comment> {
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        factId: data.factId,
        authorId: data.authorId,
        parentCommentId: data.parentCommentId ?? null
      }
    })

    return mapComment(comment)
  }

  async findById (id: string): Promise<Comment | null> {
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (comment == null) return null
    return mapComment(comment)
  }

  async update (id: string, data: { content: string }): Promise<Comment> {
    const comment = await prisma.comment.update({
      where: { id },
      data: { content: data.content }
    })
    return mapComment(comment)
  }

  async delete (id: string): Promise<void> {
    await prisma.comment.delete({ where: { id } })
  }

  async findByFactId (factId: string, params?: BaseQueryParams): Promise<ResultWithPagination<CommentWithAuthor>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)
    const orderBy = buildOrderBy(params?.order_by, params?.order_dir)

    const [topLevel, total] = await Promise.all([
      prisma.comment.findMany({
        where: { factId, parentCommentId: null },
        orderBy,
        skip,
        take,
        include: {
          author: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.comment.count({ where: { factId, parentCommentId: null } })
    ])

    const topLevelIds = topLevel.map(c => c.id)

    if (topLevelIds.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    const replies = await prisma.comment.findMany({
      where: { parentCommentId: { in: topLevelIds } },
      orderBy: { createdAt: 'asc' as const },
      include: {
        author: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
      }
    })

    const repliesByParent = new Map<string, typeof replies>()
    for (const reply of replies) {
      const parentId = reply.parentCommentId
      if (parentId == null) continue
      const existing = repliesByParent.get(parentId) ?? []
      existing.push(reply)
      repliesByParent.set(parentId, existing)
    }

    const results = topLevel.map(c => mapCommentWithAuthor({
      ...c,
      replies: repliesByParent.get(c.id) ?? []
    }))

    return buildPaginatedResult(results, total, page, limit)
  }

  async findByUserId (userId: string, params?: BaseQueryParams): Promise<ResultWithPagination<CommentWithAuthor>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { authorId: userId },
        orderBy: buildOrderBy(params?.order_by, params?.order_dir),
        skip,
        take,
        include: {
          author: { select: { username: true, displayName: true, avatarUrl: true, avatarColor: true } }
        }
      }),
      prisma.comment.count({ where: { authorId: userId } })
    ])

    return buildPaginatedResult(comments.map(mapCommentWithAuthor), total, page, limit)
  }

  async countRepliesByParentId (parentId: string, excludeAuthorId: string): Promise<number> {
    return prisma.comment.count({
      where: {
        parentCommentId: parentId,
        authorId: { not: excludeAuthorId }
      }
    })
  }

  async countRepliesByParentIds (parentIds: string[]): Promise<Map<string, number>> {
    if (parentIds.length === 0) return new Map()
    const rows = await prisma.comment.groupBy({
      by: ['parentCommentId'],
      _count: { parentCommentId: true },
      where: { parentCommentId: { in: parentIds } }
    })
    const result = new Map<string, number>()
    for (const row of rows) {
      if (row.parentCommentId == null) continue
      result.set(row.parentCommentId, row._count.parentCommentId)
    }
    return result
  }
}
