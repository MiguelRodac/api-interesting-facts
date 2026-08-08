import { AppError } from './AppError'

export class ForbiddenError extends AppError {
  constructor (message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}
