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

  async execute (factId: string, commentId: string, userId: string): Promise<CommentLikeResponse> {
    const comment = await this.commentRepository.findById(commentId)

    // The comment must exist and be a child of the factId in the URL.
    if (comment == null || comment.factId !== factId) {
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
      factId,
      createdAt: like.createdAt.toISOString()
    }
  }
}
