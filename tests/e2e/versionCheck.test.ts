import request from 'supertest'
import { app } from '../setup'

describe('Version Check Middleware (E2E)', () => {
  const originalStrict = process.env.STRICT_VERSION_CHECK

  afterAll(() => {
    process.env.STRICT_VERSION_CHECK = originalStrict
  })

  describe('When strict version check is enabled', () => {
    beforeEach(() => {
      process.env.STRICT_VERSION_CHECK = 'true'
    })

    it('should reject requests missing X-App-Version with 400 APP_VERSION_MISSING', async () => {
      const res = await request(app).get('/users/someuser')

      expect(res.status).toBe(400)
      expect(res.headers['content-type']).toContain('application/json')
      expect(res.body).toMatchObject({
        status: 400,
        error_code: 'APP_VERSION_MISSING',
        category: 'version',
        title: 'Missing Version Header',
        detail: 'App version not valid. Please update your client.'
      })
      expect(res.body.trace_id).toBeDefined()
      expect(res.body.timestamp).toBeDefined()
    })

    it('should reject outdated app versions with 426 APP_VERSION_OUTDATED', async () => {
      const res = await request(app)
        .get('/users/someuser')
        .set('X-App-Version', '0.0.0')

      expect(res.status).toBe(426)
      expect(res.headers['content-type']).toContain('application/json')
      expect(res.body).toMatchObject({
        status: 426,
        error_code: 'APP_VERSION_OUTDATED',
        category: 'version',
        title: 'Upgrade Required',
        detail: 'App version not supported. Please update your client to the latest version.'
      })
      expect(res.body.trace_id).toBeDefined()
    })

    it('should allow requests with supported app version', async () => {
      const res = await request(app)
        .get('/users/someuser')
        .set('X-App-Version', '99.0.0')

      // Should bypass versionCheck (and hit route handler returning 404 since user doesn't exist)
      expect(res.status).toBe(404)
      expect(res.body.error_code).toBe('RESOURCE_NOT_FOUND')
    })
  })

  describe('Exempt endpoints', () => {
    beforeEach(() => {
      process.env.STRICT_VERSION_CHECK = 'true'
    })

    it('should allow /ping without X-App-Version header even in strict mode', async () => {
      const res = await request(app).get('/ping').set('Accept', 'application/json')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })

    it('should allow /favicon.svg without X-App-Version header', async () => {
      const res = await request(app).get('/favicon.svg')
      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('image/svg+xml')
    })
  })
})
