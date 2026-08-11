import { DomainError } from '../../../../shared/domain/errors/domain-error'
import { BAD_REQUEST } from '../../../../shared/domain/errors/validation-error-codes'

export class ContentTooShortError extends DomainError {
  constructor (minLength: number) {
    super(BAD_REQUEST, `Content must be at least ${minLength} characters`)
  }
}
