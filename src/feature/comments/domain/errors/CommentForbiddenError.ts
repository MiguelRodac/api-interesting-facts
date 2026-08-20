import { DomainError } from '@shared/domain/errors/domain-error'
import { FORBIDDEN } from '@shared/domain/errors/authorization-error-codes'
import { type ErrorCode } from '@shared/domain/errors/error-codes'

export class CommentForbiddenError extends DomainError {
  constructor (message = 'You do not have permission to modify this comment', code: ErrorCode = FORBIDDEN) {
    super(code, message)
  }
}
