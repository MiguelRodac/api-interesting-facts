import { DomainError } from '@shared/domain/errors/domain-error'
import { FORBIDDEN } from '@shared/domain/errors/authorization-error-codes'

export class CommentForbiddenError extends DomainError {
  constructor (message = 'You do not have permission to modify this comment') {
    super(FORBIDDEN, message)
  }
}
