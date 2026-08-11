import { ErrorCategory, type ErrorCode } from './error-codes'

/**
 * Validation error detail for field-specific errors
 */
export interface ValidationErrorDetail {
  field: string
  message: string
  code?: string
}

/**
 * RFC 9457 Problem Details response structure
 * https://www.rfc-editor.org/rfc/rfc9457.html
 */
export interface RFC9457Response {
  /** URI reference that identifies the problem type */
  type: string
  /** Short, human-readable summary of the problem type */
  title: string
  /** HTTP status code */
  status: number
  /** Human-readable explanation specific to this occurrence */
  detail: string
  /** Unique error code for programmatic handling */
  error_code: string
  /** Error category for grouping */
  category: ErrorCategory
  /** URI reference that identifies the specific occurrence */
  instance: string
  /** Unique trace ID for request tracking */
  trace_id: string
  /** Timestamp when the error occurred */
  timestamp: string
  /** Additional error-specific details (validation errors array or context object) */
  details?: ValidationErrorDetail[] | Record<string, unknown>
}

/**
 * RFC 9457 Problem Details with validation errors
 */
export interface ValidationProblemDetails extends RFC9457Response {
  details: ValidationErrorDetail[]
}

/**
 * Base Error class for domain errors
 * Implements RFC 9457 Problem Details for HTTP APIs
 */
export abstract class DomainError extends Error {
  public readonly errorCode: ErrorCode
  public readonly details?: ValidationErrorDetail[] | Record<string, unknown>
  public readonly timestamp: Date

  constructor (
    errorCode: ErrorCode,
    message?: string,
    details?: ValidationErrorDetail[] | Record<string, unknown>
  ) {
    super(message ?? errorCode.defaultMessage)
    this.name = this.constructor.name
    this.errorCode = errorCode
    this.details = details
    this.timestamp = new Date()
    Error.captureStackTrace(this, this.constructor)
  }

  /** HTTP status code from error code */
  get status (): number {
    return this.errorCode.httpStatus
  }

  /** Error category */
  get category (): ErrorCategory {
    return this.errorCode.category
  }

  /** Unique error code string */
  get code (): string {
    return this.errorCode.code
  }

  /**
   * Convert error to RFC 9457 Problem Details format
   * @param instance - The URI of the request that caused the error
   * @param traceId - Unique trace ID for request tracking
   * @param includeDetails - Whether to include detailed error information (false in production)
   */
  toRFC9457 (
    instance: string,
    traceId: string,
    includeDetails: boolean = true
  ): RFC9457Response {
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
    const typeSlug = this.errorCode.code.toLowerCase().replace(/_/g, '-')

    const safeDetails = this.sanitizeDetails(this.details, includeDetails)

    return {
      type: `${baseUrl}/errors/${this.errorCode.category}/${typeSlug}`,
      title: this.formatTitle(this.errorCode.code),
      status: this.errorCode.httpStatus,
      detail: this.message,
      error_code: this.errorCode.code,
      category: this.errorCode.category,
      instance,
      trace_id: traceId,
      timestamp: this.toRFC3339(this.timestamp),
      ...((safeDetails != null) && { details: safeDetails })
    }
  }

  /**
   * Sanitize details for production environments
   * Only allows whitelisted fields that are safe to expose
   */
  private sanitizeDetails (
    details: ValidationErrorDetail[] | Record<string, unknown> | undefined,
    includeDetails: boolean
  ): ValidationErrorDetail[] | Record<string, unknown> | undefined {
    if (details == null) {
      return undefined
    }

    if (Array.isArray(details)) {
      return details
    }

    if (includeDetails) {
      return details
    }

    const safeFields = ['field', 'fields', 'errors', 'validation_errors']
    const sanitized: Record<string, unknown> = {}

    for (const key of safeFields) {
      if (Object.prototype.hasOwnProperty.call(details, key)) {
        sanitized[key] = (details)[key]
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined
  }

  /**
   * Format error code to human-readable title
   * USER_NOT_FOUND -> User Not Found
   */
  private formatTitle (code: string): string {
    return code
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Format date to RFC 3339 format
   */
  private toRFC3339 (date: Date): string {
    return date.toISOString()
  }
}

export { ErrorCategory }
export type { ErrorCode }
