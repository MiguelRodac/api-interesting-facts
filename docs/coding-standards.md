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

## 10. Testing (future)

```typescript
// Unit tests: {entity}.test.ts
// Integration tests: {entity}.integration.test.ts
// Use describe/it blocks
// Mock external dependencies (Prisma, Firebase)
```

---

**Last updated**: 2026-08-07
