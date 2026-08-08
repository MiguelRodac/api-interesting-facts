import { AppError } from '../../../../shared/domain/errors/AppError'

export class UserNotFoundError extends AppError {
  constructor (message = 'User not found') {
    super(message, 404, 'USER_NOT_FOUND')
    Object.setPrototypeOf(this, UserNotFoundError.prototype)
  }
}
