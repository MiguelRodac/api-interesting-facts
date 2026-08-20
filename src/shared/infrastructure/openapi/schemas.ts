import { z } from 'zod'
import { registry } from './registry'
import { USERNAME_PATTERN, DISPLAY_NAME_MAX_LENGTH, FACT_TITLE_MAX_LENGTH, FACT_CONTENT_MAX_LENGTH } from '@shared/domain/validation'

// ── Shared ──────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
})

export const ErrorDetailSchema = z.object({
  field: z.string().describe('Field name that caused the error'),
  message: z.string().describe('Human-readable error message for this field')
})

// ── Base fields for all error responses ──────────────────────────────────────

const baseErrorFields = {
  type: z.string().describe('URI reference that identifies the problem type'),
  title: z.string().describe('Short, human-readable summary of the problem'),
  status: z.number().int().describe('HTTP status code'),
  detail: z.string().describe('Human-readable explanation specific to this error occurrence'),
  instance: z.string().describe('URI reference of the request that caused the error'),
  trace_id: z.string().uuid().describe('Unique trace ID for request tracking'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp when the error occurred')
}

// ── Generic ErrorResponse (backward compatible) ──────────────────────────────

export const ErrorResponseSchema = z.object({
  ...baseErrorFields,
  error_code: z.string().describe('Machine-readable error code (e.g. VALIDATION_ERROR, USER_NOT_FOUND)'),
  category: z.string().describe('Error category: validation, not_found, forbidden, conflict, infra, unknown'),
  details: z.array(ErrorDetailSchema).optional().describe('Array of field-level validation errors')
})

registry.register('ErrorResponse', ErrorResponseSchema)

// ── Validation Errors (422) ─────────────────────────────────────────────────

export const ValidationErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('VALIDATION_ERROR').describe('Machine-readable error code'),
  category: z.literal('validation').describe('Error category'),
  details: z.array(ErrorDetailSchema).optional().describe('Array of field-level validation errors')
})

registry.register('ValidationError', ValidationErrorSchema)

// ── Bad Request (400) ───────────────────────────────────────────────────────

export const BadRequestErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('BAD_REQUEST').describe('Machine-readable error code'),
  category: z.literal('validation').describe('Error category'),
  details: z.array(ErrorDetailSchema).optional().describe('Array of field-level validation errors')
})

registry.register('BadRequestError', BadRequestErrorSchema)

// ── Authentication Errors (401) ─────────────────────────────────────────────

export const UnauthorizedErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('UNAUTHORIZED').describe('Machine-readable error code'),
  category: z.literal('authentication').describe('Error category')
})

registry.register('UnauthorizedError', UnauthorizedErrorSchema)

export const InvalidCredentialsErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('INVALID_CREDENTIALS').describe('Machine-readable error code'),
  category: z.literal('authentication').describe('Error category')
})

registry.register('InvalidCredentialsError', InvalidCredentialsErrorSchema)

export const TokenExpiredErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('TOKEN_EXPIRED').describe('Machine-readable error code'),
  category: z.literal('authentication').describe('Error category')
})

registry.register('TokenExpiredError', TokenExpiredErrorSchema)

// ── Authorization Errors (403) ──────────────────────────────────────────────

export const ForbiddenErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('FORBIDDEN').describe('Machine-readable error code'),
  category: z.literal('authorization').describe('Error category')
})

registry.register('ForbiddenError', ForbiddenErrorSchema)

// ── Not Found Errors (404) ──────────────────────────────────────────────────

export const ResourceNotFoundErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('RESOURCE_NOT_FOUND').describe('Machine-readable error code'),
  category: z.literal('not_found').describe('Error category')
})

registry.register('ResourceNotFoundError', ResourceNotFoundErrorSchema)

// ── Conflict Errors (409) ───────────────────────────────────────────────────

export const ResourceConflictErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('RESOURCE_CONFLICT').describe('Machine-readable error code'),
  category: z.literal('conflict').describe('Error category')
})

registry.register('ResourceConflictError', ResourceConflictErrorSchema)

export const ResourceAlreadyExistsErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('RESOURCE_ALREADY_EXISTS').describe('Machine-readable error code'),
  category: z.literal('conflict').describe('Error category')
})

registry.register('ResourceAlreadyExistsError', ResourceAlreadyExistsErrorSchema)

// ── Infrastructure Errors (500) ─────────────────────────────────────────────

export const InternalErrorSchema = z.object({
  ...baseErrorFields,
  error_code: z.literal('INTERNAL_ERROR').describe('Machine-readable error code'),
  category: z.literal('infrastructure').describe('Error category')
})

registry.register('InternalError', InternalErrorSchema)

// ── User ────────────────────────────────────────────────────────────────────

export const CreateProfileRequestSchema = z.object({
  username: z.string().regex(USERNAME_PATTERN, 'Username must be 3-30 characters and only contain letters, numbers, underscores or dots'),
  displayName: z.string().min(1).max(DISPLAY_NAME_MAX_LENGTH, `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters`),
  avatarUrl: z.string().url().optional()
})

export const DevLoginRequestSchema = z.object({
  secret: z.string().min(1),
  email: z.string().email(),
  // Firebase owns auth. Dev-only docs schema. bcrypt truncates passwords at ~72 bytes.
  password: z.string().min(6)
})

export const DevLoginResponseSchema = z.object({
  token: z.string()
})

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(DISPLAY_NAME_MAX_LENGTH, `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters`).optional(),
  avatarUrl: z.string().optional(),
  avatarColor: z.string().nullable().optional(),
  email: z.string().email().optional()
})

export const UserResponseSchema = z.object({
  firebaseUid: z.string(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable(),
  createdAt: z.string().datetime()
})

export const PublicUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable(),
  createdAt: z.string().datetime()
})

export const UserSearchResultSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable()
})

export const CheckUsernameResponseSchema = z.object({
  available: z.boolean()
})

export const AvatarOptionResponseSchema = z.object({
  id: z.string(),
  url: z.string().nullable(),
  color: z.string().nullable()
})

registry.register('CreateProfileRequest', CreateProfileRequestSchema)
registry.register('DevLoginRequest', DevLoginRequestSchema)
registry.register('DevLoginResponse', DevLoginResponseSchema)
registry.register('UpdateProfileRequest', UpdateProfileRequestSchema)
registry.register('UserResponse', UserResponseSchema)
registry.register('PublicUserResponse', PublicUserResponseSchema)
registry.register('UserSearchResult', UserSearchResultSchema)
registry.register('CheckUsernameResponse', CheckUsernameResponseSchema)
registry.register('AvatarOptionResponse', AvatarOptionResponseSchema)

// ── Fact ────────────────────────────────────────────────────────────────────

export const CreateFactRequestSchema = z.object({
  title: z.string().max(FACT_TITLE_MAX_LENGTH, `Title must be at most ${FACT_TITLE_MAX_LENGTH} characters`).nullable().optional(),
  content: z.string().min(10).max(FACT_CONTENT_MAX_LENGTH, `Content must be at most ${FACT_CONTENT_MAX_LENGTH} characters`)
})

export const UpdateFactRequestSchema = z.object({
  title: z.string().max(FACT_TITLE_MAX_LENGTH, `Title must be at most ${FACT_TITLE_MAX_LENGTH} characters`).nullable().optional(),
  content: z.string().min(10).max(FACT_CONTENT_MAX_LENGTH, `Content must be at most ${FACT_CONTENT_MAX_LENGTH} characters`).optional()
})

export const HashtagPreviewSchema = z.object({
  id: z.string(),
  tag: z.string()
})

export const HashtagWithUsageSchema = z.object({
  id: z.string(),
  tag: z.string(),
  usageCount: z.number().int()
})

export const FactAuthorPreviewSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable()
})

// ── Comment previews (used by FactResponse enrichment) ──────────────────────

export const UserAvatarPreviewSchema = z.object({
  username: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable()
})

export const CommentPreviewSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  author: UserAvatarPreviewSchema,
  parentCommentId: z.string().uuid().nullable(),
  replies: z.number().int(),
  createdAt: z.string().datetime()
})

export const FactResponseSchema = z.object({
  id: z.string().uuid(),
  author: FactAuthorPreviewSchema,
  title: z.string().nullable(),
  content: z.string(),
  likes: z.number().int(),
  liked: z.boolean().optional(),
  likeBy: z.array(UserAvatarPreviewSchema).max(2),
  comments: z.number().int(),
  commentsDetails: CommentPreviewSchema.nullable(),
  hashtags: z.array(HashtagPreviewSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const PaginatedFactResponseSchema = z.object({
  results: z.array(FactResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  nextPage: z.number().int().nullable()
})

registry.register('CreateFactRequest', CreateFactRequestSchema)
registry.register('UpdateFactRequest', UpdateFactRequestSchema)
registry.register('HashtagPreview', HashtagPreviewSchema)
registry.register('HashtagWithUsage', HashtagWithUsageSchema)
registry.register('FactResponse', FactResponseSchema)
registry.register('PaginatedFactResponse', PaginatedFactResponseSchema)

// ── Like ────────────────────────────────────────────────────────────────────

export const LikeResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  factId: z.string().uuid(),
  createdAt: z.string().datetime()
})

export const LikePreviewSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable(),
  createdAt: z.string().datetime()
})

export const PaginatedLikeResponseSchema = z.object({
  results: z.array(LikeResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  nextPage: z.number().int().nullable()
})

export const PaginatedLikePreviewResponseSchema = z.object({
  results: z.array(LikePreviewSchema),
  page: z.number().int(),
  limit: z.number().int(),
  nextPage: z.number().int().nullable()
})

registry.register('LikeResponse', LikeResponseSchema)
registry.register('LikePreview', LikePreviewSchema)
registry.register('PaginatedLikeResponse', PaginatedLikeResponseSchema)
registry.register('PaginatedLikePreviewResponse', PaginatedLikePreviewResponseSchema)

// ── Comment ────────────────────────────────────────────────────────────────

export const CommentAuthorPreviewSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  avatarColor: z.string().nullable()
})

export const CommentResponseSchema: z.ZodType<{
  id: string
  content: string
  author: z.infer<typeof CommentAuthorPreviewSchema>
  parentCommentId: string | null
  factId?: string
  createdAt: string
  updatedAt: string
  edited: boolean
  replies?: unknown[]
}> = z.object({
  id: z.string().uuid(),
  content: z.string(),
  author: CommentAuthorPreviewSchema,
  parentCommentId: z.string().uuid().nullable(),
  factId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  edited: z.boolean(),
  // Self-reference via explicit $ref (the installed zod-to-openapi lacks a ZodLazy transformer).
  replies: z.array(z.any()).optional().openapi({
    type: 'array',
    items: { $ref: '#/components/schemas/CommentResponse' }
  })
})

export const CreateCommentRequestSchema = z.object({
  content: z.string().min(10).max(500),
  parentCommentId: z.string().uuid().optional()
})

export const UpdateCommentRequestSchema = z.object({
  content: z.string()
})

export const PaginatedCommentResponseSchema = z.object({
  results: z.array(CommentResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  nextPage: z.number().int().nullable()
})

registry.register('UserAvatarPreview', UserAvatarPreviewSchema)
registry.register('CommentPreview', CommentPreviewSchema)
registry.register('CommentAuthorPreview', CommentAuthorPreviewSchema)
registry.register('CommentResponse', CommentResponseSchema)
registry.register('CreateCommentRequest', CreateCommentRequestSchema)
registry.register('UpdateCommentRequest', UpdateCommentRequestSchema)
registry.register('PaginatedCommentResponse', PaginatedCommentResponseSchema)

// ── Search ──────────────────────────────────────────────────────────────────

export const GlobalSearchResponseSchema = z.object({
  users: z.array(UserSearchResultSchema),
  facts: z.array(FactResponseSchema),
  hashtags: z.array(HashtagPreviewSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean()
})

registry.register('GlobalSearchResponse', GlobalSearchResponseSchema)

// ── Health ──────────────────────────────────────────────────────────────────

export const PingResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string().datetime(),
  uptimeSeconds: z.number().int(),
  database: z.enum(['ok', 'error']),
  documentation: z.string().url()
})

registry.register('PingResponse', PingResponseSchema)
