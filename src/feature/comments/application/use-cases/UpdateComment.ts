import { type CommentRepository } from '../../domain/ports/CommentRepository'
import { type CommentResponse } from '../dto/CommentResponse'
import { type Comment } from '../../domain/entities/Comment'
import { CommentNotFoundError } from '../../domain/errors/CommentNotFoundError'
import { CommentForbiddenError } from '../../domain/errors/CommentForbiddenError'
import { EditWindowExpiredError } from '../../domain/errors/EditWindowExpiredError'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'
import { COMMENT_CONTENT_MIN_LENGTH, COMMENT_CONTENT_MAX_LENGTH, validateMentions } from '@shared/domain/validation'

const EDIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export class UpdateComment {
  private readonly commentRepository: CommentRepository

  constructor (commentRepository: CommentRepository) {
    this.commentRepository = commentRepository
  }

  private mapToCommentResponse (comment: Comment): CommentResponse {
    return {
      id: comment.id,
      content: comment.content,
      author: {
        username: '',
        displayName: '',
        avatarUrl: null,
        avatarColor: null
      },
      parentCommentId: comment.parentCommentId,
      factId: comment.factId,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      edited: comment.updatedAt.getTime() !== comment.createdAt.getTime()
    }
  }

  async execute (commentId: string, authorId: string, content: string): Promise<CommentResponse> {
    const comment = await this.commentRepository.findById(commentId)
    if (comment === null) throw new CommentNotFoundError()
    if (comment.authorId !== authorId) throw new CommentForbiddenError()

    const trimmed = content.trim()
    const now = Date.now()

    // IDEMPOTENCY: short-circuit if content is identical (zero DB writes)
    if (trimmed === comment.content) {
      return this.mapToCommentResponse(comment)
    }

    if (now - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new EditWindowExpiredError()
    }

    if (trimmed.length < COMMENT_CONTENT_MIN_LENGTH) {
      throw new ContentTooShortError(COMMENT_CONTENT_MIN_LENGTH)
    }
    if (trimmed.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new ContentTooLongError(COMMENT_CONTENT_MAX_LENGTH)
    }

    validateMentions(trimmed)

    const updated = await this.commentRepository.update(commentId, { content: trimmed })
    return this.mapToCommentResponse(updated)
  }
}
