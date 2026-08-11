import { DomainError } from '../../../../shared/domain/errors/domain-error'
import { RESOURCE_CONFLICT } from '../../../../shared/domain/errors/conflict-error-codes'

export class LikeAlreadyExistsError extends DomainError {
  constructor (message = 'User already liked this fact') {
    super(RESOURCE_CONFLICT, message)
  }
}
