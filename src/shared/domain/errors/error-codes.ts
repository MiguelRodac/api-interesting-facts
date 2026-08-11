/**
 * Error Categories following RFC 9457 conventions
 * Used to group errors by their nature for better error handling and documentation
 */
export enum ErrorCategory {
  /** Input validation errors (malformed data, missing fields, invalid formats) */
  VALIDATION = 'validation',

  /** Business rule violations (domain logic constraints) */
  BUSINESS = 'business',

  /** Authentication errors (invalid credentials, missing token) */
  AUTHENTICATION = 'authentication',

  /** Authorization errors (insufficient permissions) */
  AUTHORIZATION = 'authorization',

  /** Resource not found errors */
  NOT_FOUND = 'not_found',

  /** Conflict errors (duplicate resources, concurrent modifications) */
  CONFLICT = 'conflict',

  /** Infrastructure errors (database, external services) */
  INFRASTRUCTURE = 'infrastructure',
}

/**
 * Error Code definition
 * Each error in the system should have a unique ErrorCode
 */
export interface ErrorCode {
  /** Unique code identifier (e.g., 'USER_EMAIL_EXISTS', 'INVALID_CREDENTIALS') */
  readonly code: string

  /** Category for grouping and filtering */
  readonly category: ErrorCategory

  /** Default message when no specific message is provided */
  readonly defaultMessage: string

  /** HTTP status code to return */
  readonly httpStatus: number
}
