import { AppError } from './AppError'

export class ConflictError extends AppError {
  constructor (message = 'Resource already exists', code = 'CONFLICT') {
    super(message, 409, code)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}
