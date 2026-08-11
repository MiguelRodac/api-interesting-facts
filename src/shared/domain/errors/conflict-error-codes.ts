import { ErrorCategory, type ErrorCode } from './error-codes'

// =============================================================================
// CONFLICT ERRORS (409)
// =============================================================================

export const RESOURCE_CONFLICT: ErrorCode = {
  code: 'RESOURCE_CONFLICT',
  category: ErrorCategory.CONFLICT,
  defaultMessage: 'Resource conflict',
  httpStatus: 409
}

export const RESOURCE_ALREADY_EXISTS: ErrorCode = {
  code: 'RESOURCE_ALREADY_EXISTS',
  category: ErrorCategory.CONFLICT,
  defaultMessage: 'Resource already exists',
  httpStatus: 409
}
