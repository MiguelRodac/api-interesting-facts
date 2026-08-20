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

export const EDIT_WINDOW_EXPIRED: ErrorCode = {
  code: 'EDIT_WINDOW_EXPIRED',
  category: ErrorCategory.AUTHORIZATION,
  defaultMessage: 'Edit window has expired (1 hour limit)',
  httpStatus: 403
}

export const DELETE_BLOCKED_HAS_REPLIES: ErrorCode = {
  code: 'DELETE_BLOCKED_HAS_REPLIES',
  category: ErrorCategory.AUTHORIZATION,
  defaultMessage: 'Cannot delete comment: other users have replied',
  httpStatus: 403
}
