import { AppError } from '../../../../shared/domain/errors/AppError'

export class FactNotFoundError extends AppError {
  constructor (message = 'Fact not found') {
    super(message, 404, 'FACT_NOT_FOUND')
    Object.setPrototypeOf(this, FactNotFoundError.prototype)
  }
}
