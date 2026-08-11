import { DomainError } from '../../../../shared/domain/errors/domain-error'
import { RESOURCE_NOT_FOUND } from '../../../../shared/domain/errors/not-found-error-codes'

export class UserNotFoundError extends DomainError {
  constructor (message = 'User not found') {
    super(RESOURCE_NOT_FOUND, message)
  }
}
