import { type CommentRepository, type CommentWithAuthor } from '../../domain/ports/CommentRepository'
import { type CommentResponse } from '../dto/CommentResponse'
import { type FactRepository } from '../../../facts/domain/ports/FactRepository'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'
import { FactNotFoundError } from '../../../facts/domain/errors/FactNotFoundError'

function mapCommentWithAuthor (comment: CommentWithAuthor, includeFactId: boolean): CommentResponse {
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
    ...(comment.replies != null && { replies: comment.replies.map(r => mapCommentWithAuthor(r, includeFactId)) })
  }
}

export class GetCommentsByFact {
  private readonly commentRepository: CommentRepository
  private readonly factRepository: FactRepository

  constructor (commentRepository: CommentRepository, factRepository: FactRepository) {
    this.commentRepository = commentRepository
    this.factRepository = factRepository
  }

  async execute (factId: string, params?: BaseQueryParams): Promise<ResultWithPagination<CommentResponse>> {
    const fact = await this.factRepository.findById(factId)

    if (fact == null) {
      throw new FactNotFoundError()
    }

    const { results: comments, ...pagination } = await this.commentRepository.findByFactId(factId, params)

    return {
      results: comments.map(c => mapCommentWithAuthor(c, false)),
      ...pagination
    }
  }
}
