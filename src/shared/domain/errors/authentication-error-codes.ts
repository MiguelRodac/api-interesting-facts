import { ErrorCategory, type ErrorCode } from './error-codes'

// =============================================================================
// AUTHENTICATION ERRORS (401)
// =============================================================================

export const UNAUTHORIZED: ErrorCode = {
  code: 'UNAUTHORIZED',
  category: ErrorCategory.AUTHENTICATION,
  defaultMessage: 'Authentication is required',
  httpStatus: 401
}

export const INVALID_CREDENTIALS: ErrorCode = {
  code: 'INVALID_CREDENTIALS',
  category: ErrorCategory.AUTHENTICATION,
  defaultMessage: 'Invalid email or password',
  httpStatus: 401
}

export const TOKEN_EXPIRED: ErrorCode = {
  code: 'TOKEN_EXPIRED',
  category: ErrorCategory.AUTHENTICATION,
  defaultMessage: 'Authentication token has expired',
  httpStatus: 401
}
