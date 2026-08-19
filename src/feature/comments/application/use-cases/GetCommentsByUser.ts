import { type CommentRepository, type CommentWithAuthor } from '../../domain/ports/CommentRepository'
import { type CommentResponse } from '../dto/CommentResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

function mapCommentWithAuthor (comment: CommentWithAuthor, includeFactId: boolean): CommentResponse {
  return {
    id: comment.id,
    content: comment.content,
    author: {
      username: comment.author.username,
      displayName: comment.author.displayName,
      avatarUrl: comment.author.avatarUrl,
      avatarColor: comment.author.avatarColor
    },
    parentCommentId: comment.parentCommentId,
    ...(includeFactId && { factId: comment.factId }),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    ...(comment.replies != null && { replies: comment.replies.map(r => mapCommentWithAuthor(r, includeFactId)) })
  }
}

export class GetCommentsByUser {
  private readonly commentRepository: CommentRepository

  constructor (commentRepository: CommentRepository) {
    this.commentRepository = commentRepository
  }

  async execute (userId: string, params?: BaseQueryParams): Promise<ResultWithPagination<CommentResponse>> {
    const { results: comments, ...pagination } = await this.commentRepository.findByUserId(userId, params)

    return {
      results: comments.map(c => mapCommentWithAuthor(c, true)),
      ...pagination
    }
  }
}
