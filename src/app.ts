import { readFileSync } from 'fs'
import { join } from 'path'
import express from 'express'
import cors from 'cors'
import { apiReference } from '@scalar/express-api-reference'
import userRoutes from '@user/infrastructure/routes/routes'
import userPublicRoutes from '@user/infrastructure/routes/publicRoutes'
import factRoutes from '@fact/infrastructure/routes/routes'
import likeRoutes from '@likes/infrastructure/routes/routes'
import { errorHandler } from '@shared/infrastructure/middleware/errorHandler'
import { httpLogger } from '@shared/infrastructure/logger/pino-http'
import prisma from '@shared/infrastructure/prisma'

const app = express()

// CORS — allow frontend origin
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
  credentials: true
}
app.use(cors(corsOptions))

app.use(express.json())
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

  const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
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
    const dbOk = dbStatus === 'ok'
    const dbColor = dbOk ? '#22c55e' : '#ef4444'
    const statusColor = dbOk ? '#22c55e' : '#ef4444'

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Interesting Facts — Alive</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .logo { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .version { color: #64748b; font-size: 14px; margin-bottom: 32px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${statusColor}22;
      border: 1px solid ${statusColor};
      color: ${statusColor};
      padding: 8px 20px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
      text-align: left;
    }
    .metric {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
    }
    .metric-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .metric-value { font-size: 20px; font-weight: 600; }
    .docs-btn {
      display: inline-block;
      background: #3b82f6;
      color: #fff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      transition: background 0.2s;
    }
    .docs-btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🦆</div>
    <h1>API Interesting Facts</h1>
    <p class="version">v${version}</p>

    <div class="status-badge">
      <span class="dot"></span>
      ${dbOk ? 'All systems operational' : 'Database unreachable'}
    </div>

    <div class="grid">
      <div class="metric">
        <div class="metric-label">Status</div>
        <div class="metric-value" style="color: ${statusColor}">${dbOk ? 'OK' : 'DEGRADED'}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Uptime</div>
        <div class="metric-value">${uptimeSeconds}s</div>
      </div>
      <div class="metric">
        <div class="metric-label">Database</div>
        <div class="metric-value" style="color: ${dbColor}">${dbOk ? 'Connected' : 'Error'}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Timestamp</div>
        <div class="metric-value" style="font-size: 14px">${now}</div>
      </div>
    </div>

    <a href="${baseUrl}/api/docs" class="docs-btn">📖 Open API Documentation</a>
  </div>
</body>
</html>`)
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
