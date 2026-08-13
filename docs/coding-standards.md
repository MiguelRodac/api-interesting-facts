# Coding Standards — api-interesting-facts

> Project-specific coding standards and conventions. Load this skill before any implementation work.

## 1. Project Structure (Hexagonal)

```
src/
├── feature/
│   └── {entity}/
│       ├── domain/
│       │   ├── entities/         ← one class per file
│       │   │   └── {Entity}.ts
│       │   └── ports/           ← interfaces only
│       │       └── {Entity}Repository.ts
│       ├── application/
│       │   ├── use-cases/      ← one class per file
│       │   │   └── {Action}{Entity}.ts
│       │   └── dto/            ← one per file
│       │       ├── {Input,Response}.ts
│       └── infrastructure/
│           ├── repositories/    ← one implementation per file
│           │   └── Prisma{Entity}Repository.ts
│           └── routes/
│               └── routes.ts
└── shared/
    ├── domain/
    │   ├── errors/              ← one class per file
    │   │   └── {ErrorName}.ts
    │   └── types/
    └── infrastructure/
        ├── config/
        ├── middleware/
        ├── logger/
        ├── prisma.ts
        └── firebase/
```

## 2. Naming Conventions

### Files
- **Classes/Interfaces**: `PascalCase` → `UserRepository.ts`, `CreateUser.ts`
- **Variables/Functions**: `camelCase` → `createUser`, `userId`
- **Constants**: `SCREAMING_SNAKE_CASE` → `MAX_RETRY_COUNT`
- **DTOs**: `{Action}{Entity}Input.ts` → `CreateUserInput.ts`
- **Routes**: `routes.ts` (not `userRoutes.ts`)

### Classes
- **Entity**: `{EntityName}` → `User`, `Fact`
- **Repository Interface**: `{Entity}Repository` → `UserRepository`
- **Repository Implementation**: `Prisma{Entity}Repository` → `PrismaUserRepository`
- **Use Case**: `{Action}{Entity}` → `CreateUser`, `GetUserByFirebaseUid`
- **Error**: `{ErrorName}Error` → `ForbiddenError`, `NotFoundError`

### Variables
- `userId` not `user_id` (camelCase)
- `createdAt` not `created_at`
- `firebaseUid` not `firebase_uid`

## 3. Import Order

```typescript
// 1. Node built-ins
import { Router } from 'express'

// 2. External packages
import { z } from 'zod'
import prisma from '../../../../shared/infrastructure/prisma'

// 3. Internal absolute imports (from shared/)
import { AppError } from '../../../../shared/domain/errors/AppError'

// 4. Relative imports (within feature)
import type { User } from '../../domain/entities/User'
import type { UserRepository } from '../../domain/ports/UserRepository'
```

## 4. TypeScript Conventions

### Interfaces vs Types
- Use `interface` for public API shapes (entities, DTOs)
- Use `type` for unions, utility types, mapped types
- **Never** use `any` — use `unknown` if type is truly unknown

```typescript
// ✅ Good
interface User {
  id: string
  email: string
}
type UserRole = 'admin' | 'user'
type PartialUser = Partial<User>

// ❌ Bad
const user: any = {}
```

### Nullable
```typescript
// ✅ Good — explicit nullable
interface User {
  avatarUrl: string | null
}

// ❌ Bad
interface User {
  avatarUrl?: string  // optional means "may not exist", not "may be null"
}
```

### Return types
```typescript
// Always explicit return types on public functions
async function createUser(data: CreateUserInput): Promise<User> {
  // ...
}
```

### Prisma client
- Single instance exported as default: `export default prisma`
- Enable query logging in dev only:
```typescript
const isDev = process.env.NODE_ENV !== 'production'
export const prisma = new PrismaClient({
  log: isDev ? ['query', 'error'] : ['error']
})
```

## 5. Error Handling

### Error Class Pattern
```typescript
// src/shared/domain/errors/{ErrorName}.ts
export class {ErrorName}Error extends AppError {
  constructor (message: string, code = '{ERROR_CODE}') {
    super(message, 403, code) // statusCode, code
  }
}
```

### Error Codes (snake_case)
```typescript
// Auth errors
'TOKEN_MISSING'
'TOKEN_INVALID'
'TOKEN_EXPIRED'
'ONBOARDING_INCOMPLETE'

// User errors
'USER_NOT_FOUND'
'USER_EXISTS'
'USERNAME_TAKEN'

// Fact errors
'FACT_NOT_FOUND'
'FACT_FORBIDDEN'
'CONTENT_TOO_SHORT'    // < 10 chars
'CONTENT_TOO_LONG'     // > 200 chars

// Like errors
'LIKE_ALREADY_EXISTS'
'LIKE_NOT_FOUND'
```

### Throwing Errors
```typescript
// ✅ Good
if (!user) {
  throw new NotFoundError('User not found', 'USER_NOT_FOUND')
}

// ❌ Bad
if (!user) {
  return res.status(404).json({ error: 'User not found' })
}
```

## 6. Git Commit Conventions

Format: `<type>(<scope>): <description>`

### Types
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code change that neither fixes a bug nor adds a feature
- `chore` — maintenance task
- `docs` — documentation only
- `test` — adding or updating tests
- `perf` — performance improvement

### Examples
```
feat(user): add onboarding flow with ONBOARDING_INCOMPLETE
feat(facts): implement CRUD with author-only edit/delete
fix(auth): resolve token verification race condition
refactor(facts): split service into use cases
chore: add Prisma migration
docs(api): update OpenAPI spec for new endpoints
```

## 7. API Design

### Routes
- **Path**: `/plural-noun` → `/facts`, `/users`, `/likes`
- **Method**: lowercase HTTP method
- **File**: `routes.ts` exports the Router

```typescript
// ✅ Good
router.post('/', requireAuth, async (req, res, next) => { ... })
router.get('/:id', async (req, res, next) => { ... })

// ❌ Bad
router.POST('/', ...) or router.createUser(...)
```

### Response Format
```typescript
// Success
res.status(201).json(createdUser)
res.status(200).json(user)

// Error
res.status(404).json({
  error: {
    code: 'USER_NOT_FOUND',
    message: 'User not found'
  }
})
```

### Status Codes
- `200` — GET success
- `201` — POST created
- `204` — DELETE success (no body)
- `400` — Validation error
- `401` — Unauthorized (no token)
- `403` — Forbidden (not allowed)
- `404` — Not found
- `409` — Conflict (duplicate)
- `500` — Internal error

### Rate limiting
- Use `express-rate-limit` with `trust proxy` enabled (`app.set('trust proxy', 1)`)
- Skip `/ping` so monitoring tools can always hit it
- Use `req.protocol` + `req.get('host')` for dynamic URLs in error messages

## 8. Use Case Pattern

```typescript
// src/feature/{entity}/application/use-cases/{Action}{Entity}.ts
export class {Action}{Entity} {
  constructor (private readonly repository: {Entity}Repository) {}

  async execute (data: InputDTO): Promise<OutputDTO> {
    // 1. Validate input
    // 2. Call repository
    // 3. Return output or throw
  }
}
```

## 9. DTO Pattern

```typescript
// Input DTO — only what the client sends
export interface CreateUserInput {
  username: string
  displayName: string
  avatarUrl?: string
}

// Response DTO — only what the client needs
export interface UserResponse {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}
```

## 11. Docker & Deployment

### Dockerfile
- Multi-stage build: `builder` stage compiles TypeScript, `production` stage runs the app
- Production image only needs: `build/`, `node_modules/`, `prisma/`, `src/`, `docs/`, `package.json`, `tsconfig.json`
- Always rewrite `tsconfig.json` baseUrl to `./build` in the production stage for tsconfig-paths to resolve aliases
- Use `node -r tsconfig-paths/register build/index.js` as CMD (not `pnpm start`)

### Prisma in Docker
- Run `prisma generate` in the builder stage only
- Copy `node_modules/.pnpm/@prisma/*` to production image for the generated client
- Never copy the entire `node_modules/` — only what's needed

### Environment variables
- All env vars must be documented in `.env.example`
- No defaults hardcoded in code — use `config/index.ts` with `??` fallbacks
- `KEEP_ALIVE_IDLE_THRESHOLD_MS` for the idle-based DB keep-alive cron

### Content negotiation for /ping
- Browser (Accept: text/html) → HTML page
- API client (Accept: application/json) → JSON
- Use `req.protocol` + `req.get('host')` for dynamic URLs, never hardcode `localhost`

## 12. API Response Design

### Enriched responses
List endpoints return nested objects + denormalized counts in a single query (max 2 DB queries):

```typescript
// ✅ Good — 2 queries total regardless of page size
async findAll(params): Promise<ResultWithPagination<EnrichedFact>> {
  // Query 1: facts + author (select only needed fields)
  const [facts, total] = await Promise.all([
    prisma.fact.findMany({
      select: {
        id: true, title: true, content: true, createdAt: true, updatedAt: true,
        author: { select: { username: true, email: true } }
      },
      skip, take, orderBy
    }),
    prisma.fact.count()
  ])

  if (facts.length === 0) return buildPaginatedResult([], total, page, limit)

  // Query 2: batch all like counts for these fact IDs
  const likeCounts = await prisma.like.groupBy({
    by: ['factId'],
    _count: { factId: true },
    where: { factId: { in: factIds } }
  })
  const likeCountMap = new Map(likeCounts.map(l => [l.factId, l._count.factId]))

  // Merge in memory
  const enriched = facts.map(f => ({
    ...f, likes: likeCountMap.get(f.id) ?? 0
  }))
  return buildPaginatedResult(enriched, total, page, limit)
}

// ❌ Bad — N+1 queries (one per fact)
for (const fact of facts) {
  fact.likes = await prisma.like.count({ where: { factId: fact.id } })
}
```

### Response DTOs
DTOs must reflect exactly what the client needs — no extra fields, no leaking internal IDs:
```typescript
// ✅ Good — client gets author preview
interface FactResponse {
  id: string
  author: { username: string; email: string }
  likes: number
  ...
}

// ❌ Bad — exposes internal authorId, leaks implementation
interface FactResponse {
  id: string
  authorId: string  // internal Prisma ID, don't expose
  likesCount: number  // underscore prefix suggests internal
  ...
}
```

## 13. Monitoring

### Error tracking — Sentry
- Import at the very top of `src/index.ts` (before other imports)
- Initialize only if `SENTRY_DSN` is set (graceful no-op if absent)
- Capture server errors via `server.on('error', Sentry.captureException)`
- Call `Sentry.close()` on graceful shutdown

### Keep-alive cron
- Timer resets on every request (via middleware in `index.ts`)
- Fires only when idle exceeds `KEEP_ALIVE_IDLE_THRESHOLD_MS` (default 20 min)
- Runs every `idleThreshold / 3` ms — catches idle without constant pinging

## 14. Testing (future)

```typescript
// Unit tests: {entity}.test.ts
// Integration tests: {entity}.integration.test.ts
// Use describe/it blocks
// Mock external dependencies (Prisma, Firebase)
```

---

**Last updated**: 2026-08-13
