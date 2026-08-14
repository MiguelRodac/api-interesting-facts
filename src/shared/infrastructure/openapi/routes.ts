import { z } from 'zod'
import { registry } from './registry'
import {
  PingResponseSchema,
  DevLoginRequestSchema,
  DevLoginResponseSchema,
  CreateProfileRequestSchema,
  UserResponseSchema,
  UpdateProfileRequestSchema,
  UserSearchResultSchema,
  CheckUsernameResponseSchema,
  AvatarOptionResponseSchema,
  PublicUserResponseSchema,
  PaginatedFactResponseSchema,
  CreateFactRequestSchema,
  FactResponseSchema,
  UpdateFactRequestSchema,
  GlobalSearchResponseSchema,
  LikeResponseSchema,
  PaginatedLikeResponseSchema,
  ErrorResponseSchema
} from './schemas'

// ── Security schemes ────────────────────────────────────────────────────────

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Firebase JWT token'
})

// ── Error responses ─────────────────────────────────────────────────────────

const unauthorizedResponse = {
  description: 'Missing or invalid authentication token',
  content: { 'application/json': { schema: ErrorResponseSchema } }
}

const forbiddenResponse = {
  description: 'Access denied or onboarding incomplete',
  content: { 'application/json': { schema: ErrorResponseSchema } }
}

const notFoundResponse = {
  description: 'Resource not found',
  content: { 'application/json': { schema: ErrorResponseSchema } }
}

const conflictResponse = {
  description: 'Resource already exists',
  content: { 'application/json': { schema: ErrorResponseSchema } }
}

const validationResponse = {
  description: 'Request validation failed',
  content: { 'application/json': { schema: ErrorResponseSchema } }
}

// ── Health ──────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/ping',
  summary: 'Health check',
  operationId: 'ping',
  tags: ['Health'],
  description: 'Returns server status with database health check.',
  responses: {
    200: {
      description: 'Server is alive',
      content: {
        'application/json': { schema: PingResponseSchema },
        'text/html': { schema: z.string() }
      }
    }
  }
})

// ── Auth ────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/auth/dev-login',
  summary: 'Generate a Firebase token for testing (dev only)',
  operationId: 'devLogin',
  tags: ['Auth'],
  description: 'Development-only endpoint. Disabled in production (returns 404).',
  request: {
    body: {
      content: { 'application/json': { schema: DevLoginRequestSchema } }
    }
  },
  responses: {
    200: {
      description: 'Firebase token generated',
      content: { 'application/json': { schema: DevLoginResponseSchema } }
    },
    400: validationResponse,
    401: unauthorizedResponse,
    404: { description: 'Not available in production' }
  }
})

registry.registerPath({
  method: 'post',
  path: '/auth/profile',
  summary: 'Create user profile (onboarding)',
  operationId: 'createProfile',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateProfileRequestSchema } }
    }
  },
  responses: {
    201: {
      description: 'Profile created',
      content: { 'application/json': { schema: UserResponseSchema } }
    },
    400: validationResponse,
    401: unauthorizedResponse,
    409: conflictResponse
  }
})

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  summary: 'Get current user profile',
  operationId: 'getCurrentUser',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user profile',
      content: { 'application/json': { schema: UserResponseSchema } }
    },
    401: unauthorizedResponse,
    403: forbiddenResponse
  }
})

registry.registerPath({
  method: 'patch',
  path: '/auth/me',
  summary: 'Update current user profile',
  operationId: 'updateCurrentUser',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: UpdateProfileRequestSchema } }
    }
  },
  responses: {
    200: {
      description: 'Profile updated',
      content: { 'application/json': { schema: UserResponseSchema } }
    },
    400: validationResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse
  }
})

// ── Users (public) ──────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/users/search',
  summary: 'Search users for @mention autocomplete',
  operationId: 'searchUsers',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({ q: z.string().min(1) })
  },
  responses: {
    200: {
      description: 'Matching users (max 10 results)',
      content: { 'application/json': { schema: z.array(UserSearchResultSchema) } }
    },
    400: validationResponse,
    401: unauthorizedResponse
  }
})

registry.registerPath({
  method: 'get',
  path: '/users/check-username',
  summary: 'Check username availability',
  operationId: 'checkUsername',
  tags: ['Users'],
  request: {
    query: z.object({ username: z.string().min(1) })
  },
  responses: {
    200: {
      description: 'Availability result',
      content: { 'application/json': { schema: CheckUsernameResponseSchema } }
    },
    400: validationResponse
  }
})

registry.registerPath({
  method: 'get',
  path: '/users/avatar-options',
  summary: 'Get all preset avatar options',
  operationId: 'getAvatarOptions',
  tags: ['Users'],
  description: 'Returns the list of available preset avatars.',
  responses: {
    200: {
      description: 'List of avatar options',
      content: { 'application/json': { schema: z.array(AvatarOptionResponseSchema) } }
    }
  }
})

registry.registerPath({
  method: 'get',
  path: '/users/{username}',
  summary: 'Get public profile by username',
  operationId: 'getPublicProfile',
  tags: ['Users'],
  request: {
    params: z.object({ username: z.string() })
  },
  responses: {
    200: {
      description: 'Public profile',
      content: { 'application/json': { schema: PublicUserResponseSchema } }
    },
    404: notFoundResponse
  }
})

// ── Facts ───────────────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  order_by: z.enum(['createdAt', 'updatedAt']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
})

const PopularQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  order_by: z.enum(['createdAt', 'updatedAt', 'likesCount']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
})

registry.registerPath({
  method: 'get',
  path: '/facts',
  summary: 'Get all facts (newest first)',
  operationId: 'getFacts',
  tags: ['Facts'],
  request: { query: ListQuerySchema },
  responses: {
    200: {
      description: 'Paginated list of facts',
      content: { 'application/json': { schema: PaginatedFactResponseSchema } }
    }
  }
})

registry.registerPath({
  method: 'post',
  path: '/facts',
  summary: 'Create a new fact',
  operationId: 'createFact',
  tags: ['Facts'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateFactRequestSchema } }
    }
  },
  responses: {
    201: {
      description: 'Fact created',
      content: { 'application/json': { schema: FactResponseSchema } }
    },
    400: validationResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse
  }
})

registry.registerPath({
  method: 'get',
  path: '/facts/search',
  summary: 'Global search (users, facts, hashtags)',
  operationId: 'globalSearch',
  tags: ['Facts'],
  description: 'Search across users, facts, and hashtags in a single request.',
  request: {
    query: z.object({ q: z.string().min(1) })
  },
  responses: {
    200: {
      description: 'Combined search results',
      content: { 'application/json': { schema: GlobalSearchResponseSchema } }
    },
    400: validationResponse
  }
})

registry.registerPath({
  method: 'get',
  path: '/facts/popular',
  summary: 'Get facts sorted by likes count',
  operationId: 'getPopularFacts',
  tags: ['Facts'],
  request: { query: PopularQuerySchema },
  responses: {
    200: {
      description: 'Paginated list of facts sorted by popularity',
      content: { 'application/json': { schema: PaginatedFactResponseSchema } }
    }
  }
})

registry.registerPath({
  method: 'get',
  path: '/facts/{id}',
  summary: 'Get a fact by ID',
  operationId: 'getFactById',
  tags: ['Facts'],
  request: {
    params: z.object({ id: z.string().uuid() })
  },
  responses: {
    200: {
      description: 'Single fact',
      content: { 'application/json': { schema: FactResponseSchema } }
    },
    404: notFoundResponse
  }
})

registry.registerPath({
  method: 'patch',
  path: '/facts/{id}',
  summary: 'Update a fact (author only)',
  operationId: 'updateFact',
  tags: ['Facts'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateFactRequestSchema } }
    }
  },
  responses: {
    200: {
      description: 'Fact updated',
      content: { 'application/json': { schema: FactResponseSchema } }
    },
    400: validationResponse,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse
  }
})

registry.registerPath({
  method: 'delete',
  path: '/facts/{id}',
  summary: 'Delete a fact (author only)',
  operationId: 'deleteFact',
  tags: ['Facts'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() })
  },
  responses: {
    204: { description: 'Fact deleted' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse
  }
})

registry.registerPath({
  method: 'get',
  path: '/facts/author/{authorId}',
  summary: 'Get all facts by an author',
  operationId: 'getFactsByAuthor',
  tags: ['Facts'],
  request: {
    params: z.object({ authorId: z.string() }),
    query: ListQuerySchema
  },
  responses: {
    200: {
      description: 'Paginated list of facts by author',
      content: { 'application/json': { schema: PaginatedFactResponseSchema } }
    }
  }
})

// ── Likes ───────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/facts/{factId}/likes',
  summary: 'Like a fact',
  operationId: 'likeFact',
  tags: ['Likes'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ factId: z.string().uuid() })
  },
  responses: {
    201: {
      description: 'Like created',
      content: { 'application/json': { schema: LikeResponseSchema } }
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: conflictResponse
  }
})

registry.registerPath({
  method: 'delete',
  path: '/facts/{factId}/likes',
  summary: 'Unlike a fact',
  operationId: 'unlikeFact',
  tags: ['Likes'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ factId: z.string().uuid() })
  },
  responses: {
    204: { description: 'Like removed' },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse
  }
})

registry.registerPath({
  method: 'get',
  path: '/facts/{factId}/likes',
  summary: 'Get all likes for a fact',
  operationId: 'getFactLikes',
  tags: ['Likes'],
  request: {
    params: z.object({ factId: z.string().uuid() }),
    query: ListQuerySchema
  },
  responses: {
    200: {
      description: 'Paginated list of likes for a fact',
      content: { 'application/json': { schema: PaginatedLikeResponseSchema } }
    }
  }
})

registry.registerPath({
  method: 'get',
  path: '/users/{userId}/likes',
  summary: 'Get all likes by a user',
  operationId: 'getUserLikes',
  tags: ['Likes'],
  request: {
    params: z.object({ userId: z.string() }),
    query: ListQuerySchema
  },
  responses: {
    200: {
      description: 'Paginated list of likes by user',
      content: { 'application/json': { schema: PaginatedLikeResponseSchema } }
    }
  }
})
