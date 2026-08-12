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

app.get('/ping', (_req, res) => {
  res.status(200).send('PONG')
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
