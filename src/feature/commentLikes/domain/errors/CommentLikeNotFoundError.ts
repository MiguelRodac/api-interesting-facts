import { DomainError } from '@shared/domain/errors/domain-error'
import { RESOURCE_NOT_FOUND } from '@shared/domain/errors/not-found-error-codes'

export class CommentLikeNotFoundError extends DomainError {
  constructor (message = 'Comment like not found') {
    super(RESOURCE_NOT_FOUND, message)
  }
}
