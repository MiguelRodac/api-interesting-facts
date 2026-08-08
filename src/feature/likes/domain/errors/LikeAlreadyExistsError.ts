import { ConflictError } from '../../../../shared/domain/errors/ConflictError'

export class LikeAlreadyExistsError extends ConflictError {
  constructor (message = 'User already liked this fact') {
    super(message, 'LIKE_ALREADY_EXISTS')
    Object.setPrototypeOf(this, LikeAlreadyExistsError.prototype)
  }
}
