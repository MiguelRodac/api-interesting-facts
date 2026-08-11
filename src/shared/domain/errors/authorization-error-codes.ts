import { ErrorCategory, type ErrorCode } from './error-codes'

// =============================================================================
// AUTHORIZATION ERRORS (403)
// =============================================================================

export const FORBIDDEN: ErrorCode = {
  code: 'FORBIDDEN',
  category: ErrorCategory.AUTHORIZATION,
  defaultMessage: 'You do not have permission to access this resource',
  httpStatus: 403
}
