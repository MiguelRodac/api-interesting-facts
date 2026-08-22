import { type CommentRepository } from '../../domain/ports/CommentRepository'
import { type Comment } from '../../domain/entities/Comment'
import { type RepostRepository } from '../../../reposts/domain/ports/RepostRepository'
import { type CreateCommentInput } from '../dto/CreateCommentInput'
import { type CommentResponse } from '../dto/CommentResponse'
import { RepostNotFoundError } from '../../../reposts/domain/errors/RepostNotFoundError'
import { CommentNotFoundError } from '../../domain/errors/CommentNotFoundError'
import { CommentInvalidParentError } from '../../domain/errors/CommentInvalidParentError'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'
import { COMMENT_CONTENT_MIN_LENGTH, COMMENT_CONTENT_MAX_LENGTH } from '@shared/domain/validation'
import { validateMentions } from '@shared/domain/validation'
import { type MentionRepository } from '../../../mentions/domain/ports/MentionRepository'
import { MentionParser } from '../../../mentions/application/MentionParser'
import { PrismaUserRepository } from '@user/infrastructure/repositories/PrismaUserRepository'

export class CreateRepostComment {
  private readonly commentRepository: CommentRepository
  private readonly repostRepository: RepostRepository
  private readonly mentionParser: MentionParser

  constructor (commentRepository: CommentRepository, repostRepository: RepostRepository, mentionRepository: MentionRepository) {
    this.commentRepository = commentRepository
    this.repostRepository = repostRepository
    this.mentionParser = new MentionParser(mentionRepository, new PrismaUserRepository())
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
      repostId: comment.repostId,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      edited: false,
      likesCount: 0,
      liked: false,
      likeBy: []
    }
  }

  async execute (repostId: string, data: CreateCommentInput, authorId: string): Promise<CommentResponse> {
    const trimmed = data.content.trim()

    if (trimmed.length < COMMENT_CONTENT_MIN_LENGTH) {
      throw new ContentTooShortError(COMMENT_CONTENT_MIN_LENGTH)
    }

    if (trimmed.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new ContentTooLongError(COMMENT_CONTENT_MAX_LENGTH)
    }

    validateMentions(trimmed)

    const repost = await this.repostRepository.findById(repostId)

    if (repost == null) {
      throw new RepostNotFoundError()
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

      if (parent.repostId !== repostId) {
        throw new CommentInvalidParentError('Reply must target a comment on the same repost')
      }

      parentCommentId = parent.id
    }

    const comment = await this.commentRepository.create({
      content: trimmed,
      repostId,
      authorId,
      parentCommentId
    })

    await this.mentionParser.storeCommentMentions(comment.id, authorId, trimmed)

    return this.mapComment(comment)
  }
}
