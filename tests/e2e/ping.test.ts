import request from 'supertest'
import { app } from '../setup'

describe('Ping Endpoints', () => {
  const originalAdminKey = process.env.ADMIN_API_KEY

  afterAll(() => {
    process.env.ADMIN_API_KEY = originalAdminKey
  })

  describe('GET /ping', () => {
    it('should return 200 JSON with general status without leaking version cache details', async () => {
      const res = await request(app)
        .get('/ping')
        .set('Accept', 'application/json')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
      expect(res.body.database).toBe('ok')
      expect(res.body.appVersionCache).toBeUndefined()
    })

    it('should return 200 HTML with status and console button', async () => {
      const res = await request(app)
        .get('/ping')
        .set('Accept', 'text/html')

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('text/html')
      expect(res.text).toContain('Interesting Facts — Status')
      expect(res.text).toContain('Consola de Versiones')
    })
  })

  describe('GET /ping/version-info', () => {
    it('should reject with 401 when admin key is missing', async () => {
      process.env.ADMIN_API_KEY = 'super-secret-admin-key'

      const res = await request(app)
        .get('/ping/version-info')

      expect(res.status).toBe(401)
      expect(res.body.status).toBe('error')
    })

    it('should reject with 401 when admin key is incorrect', async () => {
      process.env.ADMIN_API_KEY = 'super-secret-admin-key'

      const res = await request(app)
        .get('/ping/version-info')
        .set('x-admin-key', 'wrong-key')

      expect(res.status).toBe(401)
      expect(res.body.status).toBe('error')
    })

    it('should succeed with 200 when valid admin key is passed in x-admin-key header', async () => {
      process.env.ADMIN_API_KEY = 'super-secret-admin-key'

      const res = await request(app)
        .get('/ping/version-info')
        .set('x-admin-key', 'super-secret-admin-key')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
      expect(res.body.cache).toBeDefined()
    })
  })

  describe('POST /ping/refresh-versions', () => {
    it('should reject refresh with 401 when admin key is missing', async () => {
      process.env.ADMIN_API_KEY = 'super-secret-admin-key'

      const res = await request(app)
        .post('/ping/refresh-versions')

      expect(res.status).toBe(401)
      expect(res.body.status).toBe('error')
    })

    it('should reject refresh with 401 when admin key is incorrect', async () => {
      process.env.ADMIN_API_KEY = 'super-secret-admin-key'

      const res = await request(app)
        .post('/ping/refresh-versions')
        .set('x-admin-key', 'wrong-key')

      expect(res.status).toBe(401)
      expect(res.body.status).toBe('error')
    })

    it('should succeed with 200 when valid admin key is passed in x-admin-key header', async () => {
      process.env.ADMIN_API_KEY = 'super-secret-admin-key'

      const res = await request(app)
        .post('/ping/refresh-versions')
        .set('x-admin-key', 'super-secret-admin-key')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
      expect(res.body.cache).toBeDefined()
    })

    it('should succeed with 200 when valid admin key is passed in query param', async () => {
      process.env.ADMIN_API_KEY = 'super-secret-admin-key'

      const res = await request(app)
        .post('/ping/refresh-versions?key=super-secret-admin-key')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })
  })
})
