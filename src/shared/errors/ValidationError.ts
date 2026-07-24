import { AppError } from './AppError'

export class ValidationError extends AppError {
  public readonly details?: Record<string, string>

  constructor (message: string, details?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}
