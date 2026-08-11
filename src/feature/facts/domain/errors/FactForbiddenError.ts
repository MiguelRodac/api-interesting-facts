import { DomainError } from '../../../../shared/domain/errors/domain-error'
import { FORBIDDEN } from '../../../../shared/domain/errors/authorization-error-codes'

export class FactForbiddenError extends DomainError {
  constructor (message = 'You are not authorized to perform this action on this fact') {
    super(FORBIDDEN, message)
  }
}
