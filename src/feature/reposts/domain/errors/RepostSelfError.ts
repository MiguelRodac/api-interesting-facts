import { DomainError } from '@shared/domain/errors/domain-error'
import { BAD_REQUEST } from '@shared/domain/errors/validation-error-codes'

export class RepostSelfError extends DomainError {
  constructor (message = 'You cannot repost your own fact') {
    super(BAD_REQUEST, message)
  }
}
