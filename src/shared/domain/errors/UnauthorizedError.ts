import { AppError } from './AppError'

export class UnauthorizedError extends AppError {
  constructor (message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}
