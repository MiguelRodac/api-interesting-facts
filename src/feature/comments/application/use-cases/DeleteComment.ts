import { type CommentRepository } from '../../domain/ports/CommentRepository'
import { CommentNotFoundError } from '../../domain/errors/CommentNotFoundError'
import { CommentForbiddenError } from '../../domain/errors/CommentForbiddenError'

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

    await this.commentRepository.delete(id)
  }
}
