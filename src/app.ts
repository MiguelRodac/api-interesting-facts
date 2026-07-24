import { readFileSync } from 'fs'
import { join } from 'path'
import express from 'express'
import { apiReference } from '@scalar/express-api-reference'
import factsRouter from './features/interestingFacts/routes'
import { FirestoreFactRepository } from './shared/database/firebase/factRepository'
import { errorHandler } from './shared/middleware/errorHandler'
import { httpLogger } from './shared/logger/pino-http'
import { requireAuth } from './shared/middleware/auth'

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

app.use('/api/interesting-facts', factsRouter)

// TEMP: seed endpoint — DELETE AFTER USE
import { logger } from './shared/logger/index'
const tempRepo = new FirestoreFactRepository()
app.post('/api/admin/seed', async (req, res) => {
  const { title, description, studyLocation, source } = req.body
  if (!title || !description || !studyLocation || !source) {
    res.status(400).json({ error: 'title, description, studyLocation, source required' })
    return
  }
  try {
    const fact = await tempRepo.create({ title, description, studyLocation, source })
    res.status(201).json(fact)
  } catch (err) {
    logger.error({ err }, 'Seed failed')
    res.status(500).json({ error: (err as Error).message })
  }
})
// END TEMP

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' })
})

app.use(errorHandler)

export default app
