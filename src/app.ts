import { readFileSync } from 'fs'
import { join } from 'path'
import express, { type Request } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { apiReference } from '@scalar/express-api-reference'
import '@shared/infrastructure/config' // validates env vars on import
import userRoutes from '@user/infrastructure/routes/routes'
import userPublicRoutes from '@user/infrastructure/routes/publicRoutes'
import factRoutes from '@fact/infrastructure/routes/routes'
import likeRoutes from '@likes/infrastructure/routes/routes'
import commentRoutes from '@comments/infrastructure/routes/routes'
import commentLikeRoutes from '@commentLikes/infrastructure/routes/routes'
import repostRoutes from '@reposts/infrastructure/routes/routes'
import hashtagRoutes from '@hashtag/infrastructure/routes/routes'
import { errorHandler } from '@shared/infrastructure/middleware/errorHandler'
import { UnauthorizedError } from '@shared/domain/errors/app-errors'
import { versionCheck } from '@shared/infrastructure/middleware/versionCheck'

import { versionCache } from '@shared/infrastructure/cache/versionCache'
import { httpLogger } from '@shared/infrastructure/logger/pino-http'
import prisma from '@shared/infrastructure/prisma'
import { renderPingHtml } from '@shared/infrastructure/views/pingHtml'

import { faviconSvg } from '@shared/infrastructure/views/faviconSvg'

const app = express()

// Initialize dynamic version cache in the background
void versionCache.init()

// Trust Vercel's proxy to get real client IP
app.set('trust proxy', 1)

// Rate limiters — disabled in dev
const isDev = process.env.NODE_ENV !== 'production'

// Global rate limiter
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX)
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS)

if (!isDev) {
  const rateLimitHandler = (req: Request, res: express.Response): void => {
    const traceId = crypto.randomUUID()
    const baseUrl = process.env.BASE_URL ?? 'https://api-interesting-facts.onrender.com'
    res.setHeader('Content-Type', 'application/problem+json')
    res.setHeader('X-Trace-Id', traceId)
    res.status(429).json({
      type: `${baseUrl}/errors/rate-limit/exceeded`,
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit exceeded. Try again in ${Math.round(RATE_LIMIT_WINDOW_MS / 60000)} minutes.`,
      error_code: 'RATE_LIMITED',
      category: 'infrastructure',
      instance: req.originalUrl,
      trace_id: traceId,
      timestamp: new Date().toISOString()
    })
  }

  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/ping'),
    handler: rateLimitHandler
  })
  app.use(limiter)

  // Higher limit only for /hashtags and /users/search (autocomplete on keystroke)
  const autocompleteLimit = Number(process.env.AUTOCOMPLETE_RATE_LIMIT)
  const autocompleteLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: autocompleteLimit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
  })
  app.use('/hashtags', autocompleteLimiter)
  app.use('/users/search', autocompleteLimiter)
  app.use('/facts/search', autocompleteLimiter)
}

// CORS — allow frontend origin
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN as string,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id', 'X-App-Version', 'X-App-Platform', 'X-Platform', 'X-Admin-Key', 'x-admin-key'],
  credentials: true
}
app.use(cors(corsOptions))

app.use(express.json({ limit: '1mb' }))
app.use(httpLogger)

// Version check — rejects requests from outdated app versions
app.use(versionCheck)

app.get('/ping', async (req, res) => {
  const accept = req.get('Accept') ?? ''
  const prefersHtml = accept.includes('text/html')

  let dbStatus: 'ok' | 'error' = 'ok'
  let dbLatencyMs: number | null = null
  try {
    const started = Date.now()
    await prisma.$queryRaw<[{ result: number }]>`
      SELECT 1 AS result
    `
    dbLatencyMs = Date.now() - started
  } catch {
    dbStatus = 'error'
  }

  const baseUrl = `${req.protocol}://${req.get('host') ?? 'localhost'}`
  const now = new Date().toISOString()
  const uptimeSeconds = Math.round(process.uptime())
  const version = process.env.npm_package_version ?? '0.0.1'
  const environment = process.env.NODE_ENV as string

  const payload = {

    status: 'ok',
    timestamp: now,
    uptimeSeconds,
    environment,
    database: dbStatus,
    dbLatencyMs,
    version,
    documentation: `${baseUrl}/api/docs`
  }

  if (prefersHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(renderPingHtml({
      dbOk: dbStatus === 'ok',
      uptimeSeconds,
      baseUrl,
      version
    }))
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(200).json(payload)
})

// Admin endpoint — view current cached app versions
app.get('/ping/version-info', (req, res, next) => {
  try {
    const adminKey = process.env.ADMIN_API_KEY?.trim()
    const rawKey = req.headers['x-admin-key'] ?? req.query.key
    const providedKey = typeof rawKey === 'string' ? rawKey.trim() : Array.isArray(rawKey) ? (rawKey[0] as string)?.trim() : undefined

    if (providedKey == null || providedKey === '' || providedKey !== adminKey) {
      throw new UnauthorizedError('Invalid or missing admin authorization key')
    }

    const cacheStatus = versionCache.getCacheStatus()
    res.status(200).json({
      status: 'ok',
      cache: cacheStatus
    })
  } catch (err) {
    next(err)
  }
})

// Admin endpoint — refresh app version cache from DB
app.post('/ping/refresh-versions', async (req, res, next) => {
  try {
    const adminKey = process.env.ADMIN_API_KEY?.trim()
    const rawKey = req.headers['x-admin-key'] ?? req.query.key ?? (req.body as { key?: string } | undefined)?.key
    const providedKey = typeof rawKey === 'string' ? rawKey.trim() : Array.isArray(rawKey) ? (rawKey[0] as string)?.trim() : undefined

    if (providedKey == null || providedKey === '' || providedKey !== adminKey) {
      throw new UnauthorizedError('Invalid or missing admin authorization key')
    }

    const cacheStatus = await versionCache.refreshCache()
    res.status(200).json({
      status: 'ok',
      message: 'App version cache refreshed successfully',
      cache: cacheStatus
    })
  } catch (err) {
    next(err)
  }
})

// Scalar API docs (open, no auth)
const openApiSpec = readFileSync(join(__dirname, '../docs/openapi.yaml'), 'utf-8')

// Serve the favicon (used by Scalar docs page and the ping HTML page)
app.get('/favicon.svg', (_req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.status(200).send(faviconSvg)
})

app.use(
  '/api/docs',
  apiReference({
    content: openApiSpec,
    favicon: '/favicon.svg',
    pageTitle: 'Interesting Facts — API Docs'
  })
)

// Mount user routes
app.use('/auth', userRoutes)

// Mount public user routes (GET /users/:username)
app.use('/users', userPublicRoutes)

// Mount fact routes
app.use('/facts', factRoutes)

// Mount hashtag routes
app.use('/hashtags', hashtagRoutes)

// Mount like routes
app.use('/', likeRoutes)

// Mount comment routes
app.use('/', commentRoutes)

// Mount comment-like routes
app.use('/', commentLikeRoutes)

// Mount repost routes
app.use('/', repostRoutes)

app.use((_req, res) => {
  res.status(404).json({
    type: `${process.env.BASE_URL as string}/errors/not-found/route-not-found`,
    title: 'Route Not Found',
    status: 404,
    detail: `Route ${_req.method} ${_req.originalUrl} does not exist`,
    error_code: 'ROUTE_NOT_FOUND',
    category: 'not_found',
    instance: _req.originalUrl,
    trace_id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  })
})

app.use(errorHandler)

export default app
