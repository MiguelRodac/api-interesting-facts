import { type CommentRepository } from '../../domain/ports/CommentRepository'
import { type Comment } from '../../domain/entities/Comment'
import { type FactRepository } from '../../../facts/domain/ports/FactRepository'
import { type CreateCommentInput } from '../dto/CreateCommentInput'
import { type CommentResponse } from '../dto/CommentResponse'
import { FactNotFoundError } from '../../../facts/domain/errors/FactNotFoundError'
import { CommentNotFoundError } from '../../domain/errors/CommentNotFoundError'
import { CommentInvalidParentError } from '../../domain/errors/CommentInvalidParentError'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'
import { COMMENT_CONTENT_MIN_LENGTH, COMMENT_CONTENT_MAX_LENGTH } from '@shared/domain/validation'
import { validateMentions } from '@shared/domain/validation'

export class CreateComment {
  private readonly commentRepository: CommentRepository
  private readonly factRepository: FactRepository

  constructor (commentRepository: CommentRepository, factRepository: FactRepository) {
    this.commentRepository = commentRepository
    this.factRepository = factRepository
  }

  private mapComment (comment: Comment): CommentResponse {
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
      edited: false,
      // A brand-new comment has no likes yet
      likesCount: 0,
      liked: false,
      likeBy: []
    }
  }

  async execute (factId: string, data: CreateCommentInput, authorId: string): Promise<CommentResponse> {
    const trimmed = data.content.trim()

    if (trimmed.length < COMMENT_CONTENT_MIN_LENGTH) {
      throw new ContentTooShortError(COMMENT_CONTENT_MIN_LENGTH)
    }

    if (trimmed.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new ContentTooLongError(COMMENT_CONTENT_MAX_LENGTH)
    }

    validateMentions(trimmed)

    const fact = await this.factRepository.findById(factId)

    if (fact == null) {
      throw new FactNotFoundError()
    }

    let parentCommentId: string | null = null

    if (data.parentCommentId != null) {
      const parent = await this.commentRepository.findById(data.parentCommentId)

      if (parent == null) {
        throw new CommentNotFoundError()
      }

      if (parent.parentCommentId !== null) {
        throw new CommentInvalidParentError('Replies are only allowed on top-level comments')
      }

      if (parent.factId !== factId) {
        throw new CommentInvalidParentError('Reply must target a comment on the same fact')
      }

      parentCommentId = parent.id
    }

    const comment = await this.commentRepository.create({
      content: trimmed,
      factId,
      authorId,
      parentCommentId
    })

    return this.mapComment(comment)
  }
}
