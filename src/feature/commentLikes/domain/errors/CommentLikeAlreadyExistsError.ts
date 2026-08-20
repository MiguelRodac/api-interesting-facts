import { DomainError } from '@shared/domain/errors/domain-error'
import { RESOURCE_CONFLICT } from '@shared/domain/errors/conflict-error-codes'

export class CommentLikeAlreadyExistsError extends DomainError {
  constructor (message = 'User already liked this comment') {
    super(RESOURCE_CONFLICT, message)
  }
}
