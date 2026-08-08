import { AppError } from '../../../../shared/domain/errors/AppError'

export class ContentTooLongError extends AppError {
  constructor (maxLength: number) {
    super(`Content must not exceed ${maxLength} characters`, 400, 'CONTENT_TOO_LONG')
    Object.setPrototypeOf(this, ContentTooLongError.prototype)
  }
}
