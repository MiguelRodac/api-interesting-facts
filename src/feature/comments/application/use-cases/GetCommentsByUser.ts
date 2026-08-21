import { type CommentRepository, type CommentWithAuthor } from '../../domain/ports/CommentRepository'
import { type CommentResponse } from '../dto/CommentResponse'
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

function mapCommentWithAuthor (
  comment: CommentWithAuthor,
  includeFactId: boolean,
  likesCountMap: Map<string, number>,
  likeByMap: Map<string, UserAvatarPreview[]>,
  viewerLikedSet: Set<string>
): CommentResponse {
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
    edited: comment.updatedAt.getTime() !== comment.createdAt.getTime(),
    likesCount: likesCountMap.get(comment.id) ?? 0,
    liked: viewerLikedSet.has(comment.id),
    likeBy: likeByMap.get(comment.id) ?? [],
    ...(comment.replies != null && {
      replies: comment.replies.map(r => mapCommentWithAuthor(r, includeFactId, likesCountMap, likeByMap, viewerLikedSet))
    })
  }
}

export class GetCommentsByUser {
  private readonly commentRepository: CommentRepository

  constructor (commentRepository: CommentRepository) {
    this.commentRepository = commentRepository
  }

  async execute (userId: string, params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<CommentResponse>> {
    const { results: comments, ...pagination } = await this.commentRepository.findByUserId(userId, params)

    if (comments.length === 0) {
      return { results: [], ...pagination }
    }

    const commentIds = comments.map(c => c.id)

    const [likesCountMap, likeByMap, viewerLikedSet] = await Promise.all([
      this.commentRepository.countLikesByCommentIds(commentIds),
      this.commentRepository.findRecentLikersByCommentIds(commentIds),
      viewerId !== undefined
        ? this.commentRepository.findViewerLikedComments(commentIds, viewerId)
        : Promise.resolve(new Set<string>())
    ])

    return {
      results: comments.map(c => mapCommentWithAuthor(c, true, likesCountMap, likeByMap, viewerLikedSet)),
      ...pagination
    }
  }
}
