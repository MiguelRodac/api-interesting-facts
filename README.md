# API Interesting Facts

REST API for sharing interesting facts — built with Express.js, TypeScript, PostgreSQL (Prisma), and Firebase Authentication.

## Capabilities

| Resource | What |
|---------|------|
| `/auth` | Register, login, profile management (Firebase ID token auth) |
| `/facts` | Create, read, update, delete interesting facts |
| `/facts/:id/likes` | Like/unlike facts |
| `/facts/:id/comments` | Comment on facts (nested replies) |
| `/facts/:id/reposts` | Repost a fact |
| `/reposts/:id/likes` | Like/unlike reposts |
| `/reposts/:id/comments` | Comment on reposts (nested replies) |
| `/reposts/:id/comments/:cid/likes` | Like/unlike comments on reposts |
| `/users/:username` | Public user profiles + user facts |
| `/users/:userId/likes` | Everything a user liked (facts + reposts, enriched feed) |
| `/users/:username/comments` | User's comments |
| `/users/:username/mentions` | User's mentions |
| `/facts/search` | Search facts, reposts, users, hashtags (`@mention`, `#hashtag`, plain) |
| `/api/docs` | Interactive API docs (Scalar/OpenAPI) |
| `/ping` | Health check — HTML page in browser, JSON for API clients (includes docs link) |
| Rate limiting | 100 req/15 min per IP (protects against floods) |
| Version check | `X-App-Version` header — 426 if outdated, 400 if missing in strict mode |

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 22 (Alpine Linux) |
| Framework | Express.js 5 + TypeScript |
| ORM | Prisma 6 (PostgreSQL) |
| Auth | Firebase Authentication (ID tokens) |
| Validation | Zod |
| Logging | Pino + pino-http |
| API Docs | Scalar (OpenAPI 3) |

## Architecture

Clean Architecture — each feature lives under `src/feature/<name>/` with domain/application/infrastructure layers:

```
src/
├── feature/
│   ├── facts/        # Domain, use-cases, routes, repositories
│   ├── likes/        # Polymorphic likes (facts + reposts)
│   ├── comments/     # Polymorphic comments (facts + reposts) + comment likes
│   ├── reposts/      # Repost CRUD + engagement
│   ├── mentions/     # @username mentions
│   ├── hashtag/      # #hashtag search
│   └── user/         # User profiles, onboarding
└── shared/
    ├── infrastructure/
    │   ├── config/       # Environment variables (Zod-validated)
    │   ├── firebase/     # Firebase Admin SDK (lazy init)
    │   ├── logger/       # Pino HTTP logger
    │   └── middleware/   # Auth, error handling, version check
    └── domain/
        ├── errors/       # Shared error types
        └── types/        # Shared types (pagination, UserAvatarPreview)
```

## Quick start

```bash
# 1. Clone and install
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL and Firebase credentials

# 3. Run migrations and start
pnpm run prisma:migrate
pnpm run dev
```

The API runs on `http://localhost:3000`. API docs at `http://localhost:3000/api/docs`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_API_KEY` | Firebase web API key |
| `CORS_ORIGIN` | Allowed origin for CORS (default: `*`) |
| `BASE_URL` | Base URL for error responses (default: `http://localhost:3000`) |
| `PORT` | Server port (default: `3000`) |
| `MIN_APP_VERSION` | Minimum app version accepted (default: `1.0.0`) |
| `STRICT_VERSION_CHECK` | If `true`, requests missing `X-App-Version` are rejected with 400 (default: `false`) |
| `RATE_LIMIT_MAX` | Max requests per window (default: `100`) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default: `900000` / 15 min) |
| `KEEP_ALIVE_IDLE_THRESHOLD_MS` | Fire a DB ping after this many ms of idle (default: `1200000` / 20 min) |
| `SENTRY_DSN` | Sentry DSN for error tracking (optional) |

## Running locally

```bash
pnpm run dev        # Development server with hot-reload
pnpm run lint       # Lint with ts-standard
pnpm run test       # Run all test suites
pnpm run prisma:studio  # Open Prisma Studio (database GUI)
```

## Docker

```bash
# Development (from .env.docker template)
cp .env.docker .env
docker compose up --build

# Production (standalone)
docker build -t api-interesting-facts .
docker run -p 3000:3000 --env-file .env api-interesting-facts
```

The containerized API connects to an **external PostgreSQL database** (no DB embedded in the image). Set `DATABASE_URL` to your Render, Supabase, or any PostgreSQL instance.

> **Note:** `trust proxy` is enabled so Express sees the real client IP behind Vercel/Docker proxies. Rate limiting works correctly in all deployment environments.

### Keep-alive cron

Externally hosted databases (e.g. Render's free Postgres tier) go to sleep after ~30 minutes of inactivity. This API includes an **idle-based keep-alive cron** that pings the database only when no requests have arrived for a configurable threshold.

- Every incoming request resets the idle timer
- If the API sits idle for `KEEP_ALIVE_IDLE_THRESHOLD_MS` (default: 20 min), a lightweight `SELECT NOW()` runs against the DB
- As soon as a request arrives, the timer resets — no wasted pings under load

Configure with `KEEP_ALIVE_IDLE_THRESHOLD_MS` (in milliseconds). Set it below your DB's sleep threshold (Render free tier ≈ 30 min → default 20 min is safe).

## Deploy to Vercel

Vercel builds and runs the Docker image directly. Ensure these environment variables are set in your Vercel project:

- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_API_KEY`
- `CORS_ORIGIN`
- `BASE_URL`
- `MIN_APP_VERSION`
- `KEEP_ALIVE_IDLE_THRESHOLD_MS` (optional, default: 1200000)

## API overview

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | None | Register + auto-login |
| `GET` | `/auth/me` | Firebase token | Get current user profile |
| `PATCH` | `/auth/me` | Firebase token | Update profile |

### Facts — `/facts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/facts` | Firebase token | Create a fact |
| `GET` | `/facts` | None | List facts + reposts (paginated feed) |
| `GET` | `/facts/popular` | None | List popular facts (by likes) |
| `GET` | `/facts/:id` | None | Get single fact |
| `GET` | `/facts/author/:authorId` | None | Get facts by author + their reposts |
| `PATCH` | `/facts/:id` | Firebase token | Update own fact |
| `DELETE` | `/facts/:id` | Firebase token | Delete own fact |

### Fact Likes — `/facts/:factId/likes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/facts/:factId/likes` | Firebase token | Like a fact |
| `DELETE` | `/facts/:factId/likes` | Firebase token | Unlike a fact |
| `GET` | `/facts/:factId/likes` | Firebase token | Get likes for a fact |

### Fact Comments — `/facts/:factId/comments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/facts/:factId/comments` | Firebase token | Comment on a fact |
| `GET` | `/facts/:factId/comments` | Firebase token | Get comments for a fact (paginated) |

### Reposts — `/facts/:factId/reposts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/facts/:factId/reposts` | Firebase token | Repost a fact |
| `DELETE` | `/facts/:factId/reposts` | Firebase token | Undo repost |
| `GET` | `/facts/:factId/reposts` | Firebase token | Get reposts for a fact |

### Repost Likes — `/reposts/:repostId/likes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/reposts/:repostId/likes` | Firebase token | Like a repost |
| `DELETE` | `/reposts/:repostId/likes` | Firebase token | Unlike a repost |
| `GET` | `/reposts/:repostId/likes` | Firebase token | Get likes for a repost |

### Repost Comments — `/reposts/:repostId/comments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/reposts/:repostId/comments` | Firebase token | Comment on a repost |
| `GET` | `/reposts/:repostId/comments` | Firebase token | Get comments for a repost (paginated) |

### Search — `/facts/search`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/facts/search?q=@user` | Firebase token | Mentions search — users + `results` as FeedEntry[] (facts + reposts) |
| `GET` | `/facts/search?q=text` | Firebase token | Plain search — users + `results` as FeedEntry[] (facts + reposts) |
| `GET` | `/facts/search?q=%23tag` | Firebase token | Hashtag search — hashtags + legacy `facts` array |

> Response shape varies by query prefix. For `@mention` and plain queries the posts come in `results` (FeedEntry[]); for `#hashtag` queries they come in the legacy `facts` field.

### Repost detail — `/reposts/:repostId`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/reposts/:repostId` | Optional token | Full repost detail with original fact content and engagement |

### Comment Likes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/facts/:factId/comments/:commentId/likes` | Firebase token | Like a fact comment |
| `DELETE` | `/facts/:factId/comments/:commentId/likes` | Firebase token | Unlike a fact comment |
| `GET` | `/facts/:factId/comments/:commentId/likes` | Firebase token | List likes on a fact comment |
| `POST` | `/reposts/:repostId/comments/:commentId/likes` | Firebase token | Like a repost comment |
| `DELETE` | `/reposts/:repostId/comments/:commentId/likes` | Firebase token | Unlike a repost comment |
| `GET` | `/reposts/:repostId/comments/:commentId/likes` | Firebase token | List likes on a repost comment |

### Users — `/users/:username`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/:username` | None | Get user profile |
| `GET` | `/users/:username/facts` | None | Get user's facts + reposts |
| `GET` | `/users/:userId/likes` | Optional token | Get everything the user liked — FeedEntry[] (facts + reposts, enriched) |
| `GET` | `/users/:username/comments` | Firebase token | Get user's comments |
| `GET` | `/users/:username/mentions` | Firebase token | Get user's mentions |

## Feed structure

The feed (`GET /facts`) returns a mixed stream of facts and reposts. Each entry has a `type` discriminator:

### `type: "fact"`

```json
{
  "type": "fact",
  "fact": {
    "id": "uuid",
    "author": { "id": "firebaseUid", "username": "...", "displayName": "...", "avatarUrl": null, "avatarColor": null },
    "title": "Optional title",
    "content": "Fact content #hashtag @mention",
    "likes": 5,
    "liked": true,
    "likeBy": [{ "username": "...", "avatarUrl": null, "avatarColor": null }],
    "comments": 3,
    "commentsDetails": { "id": "...", "content": "...", "author": { "username": "..." }, "parentCommentId": null, "replies": 1, "createdAt": "..." },
    "repostCount": 2,
    "repostedByMe": false,
    "repostBy": [{ "username": "...", "avatarUrl": null, "avatarColor": null }],
    "hashtags": [{ "id": "...", "tag": "hashtag" }],
    "createdAt": "2026-08-24T...",
    "updatedAt": "2026-08-24T..."
  },
  "createdAt": "2026-08-24T..."
}
```

### `type: "repost"`

```json
{
  "type": "repost",
  "repost": {
    "id": "repost-uuid",
    "factId": "original-fact-uuid",
    "author": { "id": "firebaseUid", "username": "...", "displayName": "...", "avatarUrl": null, "avatarColor": null },
    "title": "Original fact title",
    "content": "Original fact content",
    "hashtags": [{ "id": "...", "tag": "hashtag" }],
    "repostCount": 5,
    "repostedBy": { "username": "...", "displayName": "...", "avatarUrl": null, "avatarColor": null, "isMe": false },
    "repostLikeCount": 3,
    "liked": false,
    "likeBy": [{ "username": "...", "avatarUrl": null, "avatarColor": null }],
    "repostCommentCount": 1,
    "repostCommentsDetails": { "id": "...", "content": "...", "author": { "username": "..." }, "parentCommentId": null, "replies": 0, "createdAt": "..." },
    "createdAt": "2026-08-24T..."
  },
  "createdAt": "2026-08-24T..."
}
```

**Key IDs for frontend:**
- `repost.id` — use for like/comment on the repost (`POST /reposts/:repostId/likes`)
- `repost.factId` — use for reposting the original fact (`POST /facts/:factId/reposts`)

> `likeBy` returns up to 3 recent users. All include `avatarUrl`/`avatarColor`; only the last entry carries `username`.

## Versioning

Clients send `X-App-Version: <semver>` on every request.

- Version older than `MIN_APP_VERSION` → **426** `APP_VERSION_OUTDATED`
- Missing header while `STRICT_VERSION_CHECK=true` → **400** `APP_VERSION_MISSING`

Error responses never disclose the minimum supported version (security).

## Security

| Protection | Implementation |
|---|---|
| Rate limiting | 100 requests / 15 min per IP (`express-rate-limit`) |
| SQL injection | Prisma ORM (parameterized queries — no raw SQL) |
| Input validation | Zod schemas on all endpoints |
| Auth | Firebase ID tokens (JWT, cryptographically verified) |
| CORS | Configurable origin whitelist |
| Body size | Limited to `1mb` to prevent payload floods |
| Version check | `X-App-Version` header validated against `MIN_APP_VERSION` (426 outdated, 400 missing in strict mode) |

## Monitoring

- **Sentry** — error tracking y performance monitoring
- **UptimeRobot** — uptime monitoring contra `/ping`

## License

ISC
