import { AppError } from './AppError'

export class ContentTooShortError extends AppError {
  constructor (minLength: number) {
    super(`Content must be at least ${minLength} characters`, 400, 'CONTENT_TOO_SHORT')
    Object.setPrototypeOf(this, ContentTooShortError.prototype)
  }
}
