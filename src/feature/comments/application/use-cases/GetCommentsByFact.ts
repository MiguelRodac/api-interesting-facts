import { type CommentRepository, type CommentWithAuthor } from '../../domain/ports/CommentRepository'
import { type CommentResponse } from '../dto/CommentResponse'
import { type FactRepository } from '../../../facts/domain/ports/FactRepository'
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'
import { FactNotFoundError } from '../../../facts/domain/errors/FactNotFoundError'

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

function collectCommentIds (comments: CommentWithAuthor[], acc: string[] = []): string[] {
  for (const c of comments) {
    acc.push(c.id)
    if (c.replies != null) collectCommentIds(c.replies, acc)
  }
  return acc
}

export class GetCommentsByFact {
  private readonly commentRepository: CommentRepository
  private readonly factRepository: FactRepository

  constructor (commentRepository: CommentRepository, factRepository: FactRepository) {
    this.commentRepository = commentRepository
    this.factRepository = factRepository
  }

  async execute (factId: string, params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<CommentResponse>> {
    const fact = await this.factRepository.findById(factId)

    if (fact == null) {
      throw new FactNotFoundError()
    }

    const { results: comments, ...pagination } = await this.commentRepository.findByFactId(factId, params)

    if (comments.length === 0) {
      return { results: [], ...pagination }
    }

    const commentIds = collectCommentIds(comments)

    const [likesCountMap, likeByMap, viewerLikedSet] = await Promise.all([
      this.commentRepository.countLikesByCommentIds(commentIds),
      this.commentRepository.findRecentLikersByCommentIds(commentIds),
      viewerId !== undefined
        ? this.commentRepository.findViewerLikedComments(commentIds, viewerId)
        : Promise.resolve(new Set<string>())
    ])

    return {
      results: comments.map(c => mapCommentWithAuthor(c, false, likesCountMap, likeByMap, viewerLikedSet)),
      ...pagination
    }
  }
}
