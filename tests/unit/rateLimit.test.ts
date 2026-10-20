import express, { type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import request from 'supertest'

describe('Rate Limit Handler & RFC 9457 Format (Integration)', () => {
  const windowMs = 60000
  const maxRequests = 2

  const rateLimitHandler = (req: Request, res: Response): void => {
    const traceId = crypto.randomUUID()
    const baseUrl = process.env.BASE_URL ?? 'https://api-interesting-facts.onrender.com'
    res.setHeader('Content-Type', 'application/problem+json')
    res.setHeader('X-Trace-Id', traceId)
    res.status(429).json({
      type: `${baseUrl}/errors/rate-limit/exceeded`,
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit exceeded. Try again in ${Math.round(windowMs / 60000)} minutes.`,
      error_code: 'RATE_LIMITED',
      category: 'infrastructure',
      instance: req.originalUrl,
      trace_id: traceId,
      timestamp: new Date().toISOString()
    })
  }

  const testApp = express()
  const limiter = rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
  })

  testApp.use(limiter)
  testApp.get('/test-rate-limit', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  it('should allow requests under the limit', async () => {
    const res1 = await request(testApp).get('/test-rate-limit')
    expect(res1.status).toBe(200)

    const res2 = await request(testApp).get('/test-rate-limit')
    expect(res2.status).toBe(200)
  })

  it('should block requests exceeding the limit with 429 RFC 9457 Problem Details', async () => {
    const res3 = await request(testApp).get('/test-rate-limit')

    expect(res3.status).toBe(429)
    expect(res3.headers['content-type']).toContain('application/problem+json')
    expect(res3.headers['x-trace-id']).toBeDefined()
    expect(res3.body).toMatchObject({
      status: 429,
      error_code: 'RATE_LIMITED',
      category: 'infrastructure',
      title: 'Too Many Requests',
      detail: expect.stringContaining('Rate limit exceeded')
    })
    expect(res3.body.instance).toBe('/test-rate-limit')
    expect(res3.body.trace_id).toBeDefined()
    expect(res3.body.timestamp).toBeDefined()
  })
})
