import { type CommentLikeRepository } from '../../domain/ports/CommentLikeRepository'
import { type CommentRepository } from '../../../comments/domain/ports/CommentRepository'
import { type CommentLikeResponse } from '../dto/CommentLikeResponse'
import { CommentLikeNotFoundError } from '../../domain/errors/CommentLikeNotFoundError'
import { CommentLikeAlreadyExistsError } from '../../domain/errors/CommentLikeAlreadyExistsError'

export class CreateCommentLike {
  private readonly commentLikeRepository: CommentLikeRepository
  private readonly commentRepository: CommentRepository

  constructor (commentLikeRepository: CommentLikeRepository, commentRepository: CommentRepository) {
    this.commentLikeRepository = commentLikeRepository
    this.commentRepository = commentRepository
  }

  async execute (commentId: string, userId: string, opts: { factId?: string, repostId?: string } = {}): Promise<CommentLikeResponse> {
    const comment = await this.commentRepository.findById(commentId)

    if (comment == null) {
      throw new CommentLikeNotFoundError()
    }

    // Validate parent matches: fact comment → factId, repost comment → repostId
    if (opts.factId != null && comment.factId !== opts.factId) {
      throw new CommentLikeNotFoundError()
    }
    if (opts.repostId != null && comment.repostId !== opts.repostId) {
      throw new CommentLikeNotFoundError()
    }

    const existingLike = await this.commentLikeRepository.findByUserAndComment(userId, commentId)

    if (existingLike != null) {
      throw new CommentLikeAlreadyExistsError()
    }

    const like = await this.commentLikeRepository.create(userId, commentId)

    return {
      id: like.id,
      userId: like.userId,
      commentId: like.commentId,
      factId: comment.factId,
      repostId: comment.repostId,
      createdAt: like.createdAt.toISOString()
    }
  }
}
