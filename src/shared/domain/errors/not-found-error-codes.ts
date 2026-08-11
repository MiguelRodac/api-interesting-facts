import { ErrorCategory, type ErrorCode } from './error-codes'

// =============================================================================
// NOT FOUND ERRORS (404)
// =============================================================================

export const RESOURCE_NOT_FOUND: ErrorCode = {
  code: 'RESOURCE_NOT_FOUND',
  category: ErrorCategory.NOT_FOUND,
  defaultMessage: 'The requested resource was not found',
  httpStatus: 404
}
