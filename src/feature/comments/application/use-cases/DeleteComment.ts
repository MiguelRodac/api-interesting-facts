import { type CommentRepository } from '../../domain/ports/CommentRepository'
import { CommentNotFoundError } from '../../domain/errors/CommentNotFoundError'
import { CommentForbiddenError } from '../../domain/errors/CommentForbiddenError'
import { DELETE_BLOCKED_HAS_REPLIES } from '@shared/domain/errors/authorization-error-codes'

export class DeleteComment {
  private readonly commentRepository: CommentRepository

  constructor (commentRepository: CommentRepository) {
    this.commentRepository = commentRepository
  }

  async execute (id: string, authorId: string): Promise<void> {
    const comment = await this.commentRepository.findById(id)

    if (comment == null) {
      throw new CommentNotFoundError()
    }

    if (comment.authorId !== authorId) {
      throw new CommentForbiddenError()
    }

    const otherRepliesCount = await this.commentRepository.countRepliesByParentId(id, comment.authorId)
    if (otherRepliesCount > 0) {
      throw new CommentForbiddenError(
        'Cannot delete comment: other users have replied',
        DELETE_BLOCKED_HAS_REPLIES
      )
    }

    await this.commentRepository.delete(id)
  }
}
