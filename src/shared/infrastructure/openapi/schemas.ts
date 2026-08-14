import { z } from 'zod'
import { registry } from './registry'

// ── Shared ──────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
})

export const ErrorDetailSchema = z.object({
  field: z.string().describe('Field name that caused the error'),
  message: z.string().describe('Human-readable error message for this field')
})

export const ErrorResponseSchema = z.object({
  type: z.string().describe('URI reference that identifies the problem type'),
  title: z.string().describe('Short, human-readable summary of the problem'),
  status: z.number().int().describe('HTTP status code'),
  detail: z.string().describe('Human-readable explanation specific to this error occurrence'),
  error_code: z.string().describe('Machine-readable error code (e.g. VALIDATION_ERROR, USER_NOT_FOUND)'),
  category: z.string().describe('Error category: validation, not_found, forbidden, conflict, infra, unknown'),
  instance: z.string().describe('URI reference of the request that caused the error'),
  trace_id: z.string().uuid().describe('Unique trace ID for request tracking'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp when the error occurred'),
  details: z.array(ErrorDetailSchema).optional().describe('Array of field-level validation errors')
})

registry.register('ErrorResponse', ErrorResponseSchema)

// ── User ────────────────────────────────────────────────────────────────────

export const CreateProfileRequestSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]{3,30}$/),
  displayName: z.string().min(1),
  avatarUrl: z.string().url().optional()
})

export const DevLoginRequestSchema = z.object({
  secret: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1)
})

export const DevLoginResponseSchema = z.object({
  token: z.string()
})

export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1).optional(),
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
  color: z.string()
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
  title: z.string().nullable().optional(),
  content: z.string().min(10).max(200)
})

export const UpdateFactRequestSchema = z.object({
  title: z.string().nullable().optional(),
  content: z.string().min(10).max(200).optional()
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

export const FactResponseSchema = z.object({
  id: z.string().uuid(),
  author: FactAuthorPreviewSchema,
  title: z.string().nullable(),
  content: z.string(),
  likes: z.number().int(),
  liked: z.boolean().optional(),
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

export const PaginatedLikeResponseSchema = z.object({
  results: z.array(LikeResponseSchema),
  page: z.number().int(),
  limit: z.number().int(),
  nextPage: z.number().int().nullable()
})

registry.register('LikeResponse', LikeResponseSchema)
registry.register('PaginatedLikeResponse', PaginatedLikeResponseSchema)

// ── Search ──────────────────────────────────────────────────────────────────

export const GlobalSearchResponseSchema = z.object({
  users: z.array(UserSearchResultSchema),
  facts: z.array(FactResponseSchema),
  hashtags: z.array(HashtagPreviewSchema),
  hasMoreUsers: z.boolean(),
  hasMoreFacts: z.boolean(),
  hasMoreHashtags: z.boolean()
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
