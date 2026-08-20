import { type CommentLikeRepository } from '../../domain/ports/CommentLikeRepository'
import { type CommentLikePreviewResponse } from '../dto/CommentLikeResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetCommentLikesByCommentId {
  private readonly commentLikeRepository: CommentLikeRepository

  constructor (commentLikeRepository: CommentLikeRepository) {
    this.commentLikeRepository = commentLikeRepository
  }

  async execute (commentId: string, params?: BaseQueryParams): Promise<ResultWithPagination<CommentLikePreviewResponse>> {
    const { results: likes, ...pagination } = await this.commentLikeRepository.findByCommentId(commentId, params)

    return {
      results: likes.map(like => ({
        id: like.id,
        username: like.username,
        displayName: like.displayName,
        avatarUrl: like.avatarUrl,
        avatarColor: like.avatarColor,
        createdAt: like.createdAt.toISOString()
      })),
      ...pagination
    }
  }
}
