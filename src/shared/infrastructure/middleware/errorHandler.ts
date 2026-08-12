import { type Request, type Response, type NextFunction } from 'express'
import { ZodError } from 'zod'
import { DomainError, ErrorCategory, type RFC9457Response } from '../../domain/errors/domain-error'
import { BadRequestError, ConflictError, ValidationError } from '../../domain/errors/app-errors'
import { INTERNAL_ERROR } from '../../domain/errors/infrastructure-error-codes'
import { logger } from '../logger'

/** RFC 9457 Problem Details Content-Type */
export const PROBLEM_CONTENT_TYPE = 'application/problem+json'

/**
 * Generate or extract trace ID from request
 * Uses x-trace-id header if present, otherwise generates a UUID
 */
function getTraceId (req: Request): string {
  const headerTraceId = req.headers['x-trace-id']
  if (headerTraceId != null && typeof headerTraceId === 'string') {
    return headerTraceId
  }
  return crypto.randomUUID()
}

/**
 * PostgreSQL error codes
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  EXCLUSION_VIOLATION: '23P01',
  CONNECTION_FAILURE: '08006',
  CONNECTION_DOES_NOT_EXIST: '08003'
} as const

interface PrismaError {
  code?: string
  clientVersion?: string
}

/**
 * Convert Prisma errors to domain errors
 */
function convertPrismaError (error: Error & PrismaError): DomainError | null {
  const code = error.code

  if (code == null) {
    return null
  }

  switch (code) {
    case PG_ERROR_CODES.UNIQUE_VIOLATION: {
      return new ConflictError('Value already exists')
    }

    case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION: {
      return new BadRequestError('Referenced record not found')
    }

    case PG_ERROR_CODES.NOT_NULL_VIOLATION: {
      return new BadRequestError('Required field missing')
    }

    case PG_ERROR_CODES.CHECK_VIOLATION: {
      return new BadRequestError('Constraint violation')
    }

    case PG_ERROR_CODES.EXCLUSION_VIOLATION: {
      return new ConflictError('Conflicts with existing value')
    }

    case PG_ERROR_CODES.CONNECTION_FAILURE:
    case PG_ERROR_CODES.CONNECTION_DOES_NOT_EXIST: {
      logger.error({ code }, 'Database connection error')
      return null
    }

    default:
      return null
  }
}

/**
 * Global Error Handler Middleware
 * Implements RFC 9457 Problem Details for HTTP APIs with trace_id support
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const traceId = getTraceId(req)
  const instance = req.originalUrl
  const isDev = process.env.NODE_ENV !== 'production'

  logger.error(
    {
      trace_id: traceId,
      err: error,
      path: req.path,
      method: req.method
    },
    error.message
  )

  res.setHeader('Content-Type', PROBLEM_CONTENT_TYPE)
  res.setHeader('X-Trace-Id', traceId)

  if (error instanceof DomainError) {
    const problemDetails = error.toRFC9457(instance, traceId, isDev)
    res.status(error.status).json(problemDetails)
    return
  }

  // Zod validation errors → 422 ValidationError
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }))
    const validationError = new ValidationError('Request validation failed', issues)
    const problemDetails = validationError.toRFC9457(instance, traceId, isDev)
    res.status(422).json(problemDetails)
    return
  }

  const prismaError = convertPrismaError(error)
  if (prismaError != null) {
    const problemDetails = prismaError.toRFC9457(instance, traceId, isDev)
    res.status(prismaError.status).json(problemDetails)
    return
  }

  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
  const problemDetails: RFC9457Response = {
    type: `${baseUrl}/errors/${ErrorCategory.INFRASTRUCTURE}/internal-error`,
    title: 'Internal Error',
    status: 500,
    detail: 'An unexpected error occurred',
    error_code: INTERNAL_ERROR.code,
    category: ErrorCategory.INFRASTRUCTURE,
    instance,
    trace_id: traceId,
    timestamp: new Date().toISOString()
  }

  if (isDev && error.stack != null) {
    problemDetails.details = { stack: error.stack }
  }

  res.status(500).json(problemDetails)
}
