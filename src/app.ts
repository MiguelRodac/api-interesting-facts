import express from 'express'
import factsRouter from './features/interestingFacts/routes'
import { errorHandler } from './shared/middleware/errorHandler'

const app = express()

app.use(express.json())

app.get('/ping', (_req, res) => {
  res.status(200).send('PONG')
})

app.use('/api/interesting-facts', factsRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' })
})

app.use(errorHandler)

export default app
