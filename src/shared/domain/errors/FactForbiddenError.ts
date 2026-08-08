import { AppError } from './AppError'

export class FactForbiddenError extends AppError {
  constructor (message = 'You are not authorized to perform this action on this fact') {
    super(message, 403, 'FACT_FORBIDDEN')
    Object.setPrototypeOf(this, FactForbiddenError.prototype)
  }
}
