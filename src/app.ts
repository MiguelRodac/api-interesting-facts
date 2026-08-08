import { readFileSync } from 'fs'
import { join } from 'path'
import express from 'express'
import { apiReference } from '@scalar/express-api-reference'
import userRoutes from './feature/user/infrastructure/routes/routes'
import factRoutes from './feature/facts/infrastructure/routes/routes'
import likeRoutes from './feature/likes/infrastructure/routes/routes'
import { errorHandler } from './shared/infrastructure/middleware/errorHandler'
import { httpLogger } from './shared/infrastructure/logger/pino-http'
import { requireAuth } from './shared/infrastructure/middleware/auth'

const app = express()

app.use(express.json())
app.use(httpLogger)

app.get('/ping', (_req, res) => {
  res.status(200).send('PONG')
})

// Scalar API docs
const openApiSpec = readFileSync(join(__dirname, '../docs/openapi.yaml'), 'utf-8')

app.use(
  '/api/docs',
  requireAuth,
  apiReference({ content: openApiSpec })
)

// Mount user routes
app.use('/auth', userRoutes)

// Mount fact routes
app.use('/facts', factRoutes)

// Mount like routes
app.use('/', likeRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' })
})

app.use(errorHandler)

export default app
