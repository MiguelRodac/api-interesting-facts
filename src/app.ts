import { readFileSync } from 'fs'
import { join } from 'path'
import express, { type Request } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { apiReference } from '@scalar/express-api-reference'
import userRoutes from '@user/infrastructure/routes/routes'
import userPublicRoutes from '@user/infrastructure/routes/publicRoutes'
import factRoutes from '@fact/infrastructure/routes/routes'
import likeRoutes from '@likes/infrastructure/routes/routes'
import { errorHandler } from '@shared/infrastructure/middleware/errorHandler'
import { httpLogger } from '@shared/infrastructure/logger/pino-http'
import prisma from '@shared/infrastructure/prisma'
import { renderPingHtml } from '@shared/infrastructure/views/pingHtml'

const app = express()

// Trust Vercel's proxy to get real client IP
app.set('trust proxy', 1)

// Global rate limiter — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip /ping so monitoring tools can always hit it
  skip: (req) => req.path === '/ping',
  message: (req: Request) => ({
    status: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Try again in 15 minutes.',
    documentation: `${req.protocol}://${req.get('host') ?? 'localhost'}/api/docs`
  })
})
app.use(limiter)

// CORS — allow frontend origin
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
  credentials: true
}
app.use(cors(corsOptions))

app.use(express.json({ limit: '1mb' }))
app.use(httpLogger)

app.get('/ping', async (req, res) => {
  const accept = req.get('Accept') ?? ''
  const prefersHtml = accept.includes('text/html')

  let dbStatus: 'ok' | 'error' = 'ok'
  try {
    await prisma.$queryRaw<[{ now: Date }]>`
      SELECT 1 AS result
    `
  } catch {
    dbStatus = 'error'
  }

  const baseUrl = `${req.protocol}://${req.get('host') ?? 'localhost'}`
  const now = new Date().toISOString()
  const uptimeSeconds = Math.round(process.uptime())
  const version = process.env.npm_package_version ?? '0.0.1'

  const payload = {
    status: 'ok',
    timestamp: now,
    uptimeSeconds,
    database: dbStatus,
    documentation: `${baseUrl}/api/docs`
  }

  if (prefersHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(renderPingHtml({
      dbOk: dbStatus === 'ok',
      uptimeSeconds,
      timestamp: now,
      baseUrl,
      version
    }))
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(200).json(payload)
})

// Scalar API docs (open, no auth)
const openApiSpec = readFileSync(join(__dirname, '../docs/openapi.yaml'), 'utf-8')

app.use(
  '/api/docs',
  apiReference({ content: openApiSpec })
)

// Mount user routes
app.use('/auth', userRoutes)

// Mount public user routes (GET /users/:username)
app.use('/users', userPublicRoutes)

// Mount fact routes
app.use('/facts', factRoutes)

// Mount like routes
app.use('/', likeRoutes)

app.use((_req, res) => {
  res.status(404).json({
    type: `${process.env.BASE_URL ?? 'http://localhost:3000'}/errors/not-found/route-not-found`,
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
