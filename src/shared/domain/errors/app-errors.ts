import { type ValidationErrorDetail, DomainError, type RFC9457Response } from './domain-error'
import { UNAUTHORIZED } from './authentication-error-codes'
import { FORBIDDEN } from './authorization-error-codes'
import { RESOURCE_CONFLICT } from './conflict-error-codes'
import { INTERNAL_ERROR } from './infrastructure-error-codes'
import { RESOURCE_NOT_FOUND } from './not-found-error-codes'
import { BAD_REQUEST, VALIDATION_ERROR } from './validation-error-codes'

/**
 * Generic Application Error - accepts any ErrorCode
 */
export class AppError extends DomainError {}

/**
 * Not Found Error - Resource not found (HTTP 404)
 */
export class NotFoundError extends DomainError {
  constructor (resource: string, id?: string) {
    const detail = id != null && id !== ''
      ? `The ${resource} with identifier '${id}' was not found`
      : `The requested ${resource} was not found`
    super(RESOURCE_NOT_FOUND, detail, { resource, ...(id != null && id !== '' && { id }) })
  }
}

/**
 * Validation Error - Invalid input data (HTTP 422)
 */
export class ValidationError extends DomainError {
  public override readonly details: ValidationErrorDetail[]

  constructor (detail: string = 'Request validation failed', details: ValidationErrorDetail[] = []) {
    super(VALIDATION_ERROR, detail)
    this.details = details
  }

  override toRFC9457 (
    instance: string,
    traceId: string,
    includeDetails: boolean = true
  ): RFC9457Response & { details: ValidationErrorDetail[] } {
    return {
      ...super.toRFC9457(instance, traceId, includeDetails),
      details: this.details
    }
  }
}

/**
 * Conflict Error - Resource already exists (HTTP 409)
 */
export class ConflictError extends DomainError {
  public override readonly details: ValidationErrorDetail[]

  constructor (detail: string, details: ValidationErrorDetail[] = []) {
    super(RESOURCE_CONFLICT, detail)
    this.details = details
  }

  override toRFC9457 (
    instance: string,
    traceId: string,
    includeDetails: boolean = true
  ): RFC9457Response & { details: ValidationErrorDetail[] } {
    return {
      ...super.toRFC9457(instance, traceId, includeDetails),
      details: this.details
    }
  }
}

/**
 * Bad Request Error - Malformed request (HTTP 400)
 */
export class BadRequestError extends DomainError {
  constructor (detail: string) {
    super(BAD_REQUEST, detail)
  }
}

/**
 * Unauthorized Error - Authentication required (HTTP 401)
 */
export class UnauthorizedError extends DomainError {
  constructor (detail: string = 'Authentication is required to access this resource') {
    super(UNAUTHORIZED, detail)
  }
}

/**
 * Forbidden Error - Access denied (HTTP 403)
 */
export class ForbiddenError extends DomainError {
  constructor (detail: string = 'You do not have permission to access this resource') {
    super(FORBIDDEN, detail)
  }
}

/**
 * Internal Server Error - Unexpected error (HTTP 500)
 */
export class InternalServerError extends DomainError {
  constructor (detail: string = 'An unexpected error occurred') {
    super(INTERNAL_ERROR, detail)
  }
}
