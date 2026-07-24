import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { ValidationError } from '../errors/ValidationError'
import { logger } from '../logger'

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    const response: Record<string, any> = {
      error: err.message,
      code: err.code
    }
    if (err instanceof ValidationError && err.details != null) {
      response.details = err.details
    }
    res.status(err.statusCode).json(response)
    return
  }

  logger.error({ err }, 'Unhandled error')
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  })
}
