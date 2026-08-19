import { DomainError } from '@shared/domain/errors/domain-error'
import { BAD_REQUEST } from '@shared/domain/errors/validation-error-codes'

export class CommentInvalidParentError extends DomainError {
  constructor (message = 'Invalid parent comment') {
    super(BAD_REQUEST, message)
  }
}
