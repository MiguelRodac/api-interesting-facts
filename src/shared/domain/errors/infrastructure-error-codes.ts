import { ErrorCategory, type ErrorCode } from './error-codes'

// =============================================================================
// INFRASTRUCTURE ERRORS (500, 502, 503)
// =============================================================================

export const INTERNAL_ERROR: ErrorCode = {
  code: 'INTERNAL_ERROR',
  category: ErrorCategory.INFRASTRUCTURE,
  defaultMessage: 'An unexpected error occurred',
  httpStatus: 500
}

export const DATABASE_ERROR: ErrorCode = {
  code: 'DATABASE_ERROR',
  category: ErrorCategory.INFRASTRUCTURE,
  defaultMessage: 'Database operation failed',
  httpStatus: 500
}
