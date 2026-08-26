import { type CommentLikeRepository } from '../../domain/ports/CommentLikeRepository'
import { type CommentRepository } from '../../../comments/domain/ports/CommentRepository'
import { CommentLikeNotFoundError } from '../../domain/errors/CommentLikeNotFoundError'

export class DeleteCommentLike {
  private readonly commentLikeRepository: CommentLikeRepository
  private readonly commentRepository: CommentRepository

  constructor (commentLikeRepository: CommentLikeRepository, commentRepository: CommentRepository) {
    this.commentLikeRepository = commentLikeRepository
    this.commentRepository = commentRepository
  }

  async execute (commentId: string, userId: string, opts: { factId?: string, repostId?: string } = {}): Promise<void> {
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

    if (existingLike == null) {
      throw new CommentLikeNotFoundError()
    }

    await this.commentLikeRepository.delete(userId, commentId)
  }
}
