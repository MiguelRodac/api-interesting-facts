import { AppError } from './AppError'

export class LikeNotFoundError extends AppError {
  constructor (message = 'Like not found') {
    super(message, 404, 'LIKE_NOT_FOUND')
    Object.setPrototypeOf(this, LikeNotFoundError.prototype)
  }
}
