import { DomainError } from '@shared/domain/errors/domain-error'
import { RESOURCE_CONFLICT } from '@shared/domain/errors/conflict-error-codes'

export class RepostAlreadyExistsError extends DomainError {
  constructor (message = 'User already reposted this fact') {
    super(RESOURCE_CONFLICT, message)
  }
}
