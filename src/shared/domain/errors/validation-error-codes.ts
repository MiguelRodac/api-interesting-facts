import { ErrorCategory, type ErrorCode } from './error-codes'

// =============================================================================
// VALIDATION ERRORS (400, 413, 422)
// =============================================================================

export const VALIDATION_ERROR: ErrorCode = {
  code: 'VALIDATION_ERROR',
  category: ErrorCategory.VALIDATION,
  defaultMessage: 'Request validation failed',
  httpStatus: 422
}

export const BAD_REQUEST: ErrorCode = {
  code: 'BAD_REQUEST',
  category: ErrorCategory.VALIDATION,
  defaultMessage: 'Malformed request',
  httpStatus: 400
}

export const INVALID_FORMAT: ErrorCode = {
  code: 'INVALID_FORMAT',
  category: ErrorCategory.VALIDATION,
  defaultMessage: 'Invalid data format',
  httpStatus: 400
}
