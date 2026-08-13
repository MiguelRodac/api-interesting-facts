# API Interesting Facts

REST API for sharing interesting facts — built with Express.js, TypeScript, PostgreSQL (Prisma), and Firebase Authentication.

## Capabilities

| Resource | What |
|---------|------|
| `/auth` | Register, login, profile management (Firebase ID token auth) |
| `/facts` | Create, read, update, delete interesting facts |
| `/users/:username` | Public user profiles |
| `/likes` | Like/unlike facts, list likes by fact or user |
| `/api/docs` | Interactive API docs (Scalar/OpenAPI) |
| `/ping` | Health check — HTML page in browser, JSON for API clients (includes docs link) |
| Rate limiting | 100 req/15 min per IP (protects against floods) |

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
│   ├── facts/       # Domain, use-cases, routes, repositories
│   ├── likes/       # Same structure
│   └── user/        # Same structure
└── shared/
    ├── infrastructure/
    │   ├── config/       # Environment variables (Zod-validated)
    │   ├── firebase/     # Firebase Admin SDK (lazy init)
    │   ├── logger/       # Pino HTTP logger
    │   └── middleware/   # Auth, error handling
    └── domain/
        └── errors/       # Shared error types
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
| `DEV_LOGIN_SECRET` | Secret for `/auth/dev-login` (dev only) |
| `CORS_ORIGIN` | Allowed origin for CORS (default: `*`) |
| `PORT` | Server port (default: `3000`) |
| `KEEP_ALIVE_IDLE_THRESHOLD_MS` | Fire a DB ping after this many ms of idle (default: `1200000` / 20 min) |

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
- `DEV_LOGIN_SECRET`
- `CORS_ORIGIN`
- `KEEP_ALIVE_IDLE_THRESHOLD_MS` (optional, default: 1200000)

## API overview

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | None | Register + auto-login |
| `POST` | `/auth/dev-login` | `DEV_LOGIN_SECRET` | Dev login with email/password → Firebase token |
| `GET` | `/auth/me` | Firebase token | Get current user profile |
| `PATCH` | `/auth/me` | Firebase token | Update profile |

### Facts — `/facts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/facts` | Firebase token | Create a fact |
| `GET` | `/facts` | None | List facts (paginated) |
| `GET` | `/facts/:id` | None | Get single fact |
| `PATCH` | `/facts/:id` | Firebase token | Update own fact |
| `DELETE` | `/facts/:id` | Firebase token | Delete own fact |

### Likes — `/likes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/likes` | Firebase token | Like a fact |
| `DELETE` | `/likes/:factId` | Firebase token | Unlike a fact |
| `GET` | `/likes/fact/:factId` | None | Get likes for a fact |
| `GET` | `/likes/user` | Firebase token | Get current user's likes |

## Security

| Protection | Implementation |
|---|---|
| Rate limiting | 100 requests / 15 min per IP (`express-rate-limit`) |
| SQL injection | Prisma ORM (parameterized queries — no raw SQL) |
| Input validation | Zod schemas on all endpoints |
| Auth | Firebase ID tokens (JWT, cryptographically verified) |
| CORS | Configurable origin whitelist |
| Body size | Limited to `1mb` to prevent payload floods |

## Monitoring

- **Sentry** — error tracking y performance monitoring
- **UptimeRobot** — uptime monitoring contra `/ping`

## License

ISC
