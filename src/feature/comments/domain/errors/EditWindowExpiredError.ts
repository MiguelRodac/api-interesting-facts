import { DomainError } from '@shared/domain/errors/domain-error'
import { EDIT_WINDOW_EXPIRED } from '@shared/domain/errors/authorization-error-codes'

export class EditWindowExpiredError extends DomainError {
  constructor () {
    super(EDIT_WINDOW_EXPIRED, 'Edit window has expired (1 hour limit)')
  }
}
