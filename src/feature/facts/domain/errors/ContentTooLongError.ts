import { DomainError } from '@shared/domain/errors/domain-error'
import { BAD_REQUEST } from '@shared/domain/errors/validation-error-codes'

export class ContentTooLongError extends DomainError {
  constructor (maxLength: number) {
    super(BAD_REQUEST, `Content must not exceed ${maxLength} characters`)
  }
}
