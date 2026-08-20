import request from 'supertest'
import { app, prisma } from '../setup'

describe('Reposts Endpoints', () => {
  const validToken = 'valid-test-token'
  const otherToken = 'other-valid-token'
  const noProfileToken = 'no-profile-token'

  beforeEach(async () => {
    // Create test users using upsert to handle existing data
    await prisma.user.upsert({
      where: { firebaseUid: 'test-uid' },
      update: {},
      create: {
        firebaseUid: 'test-uid',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      }
    })
    await prisma.user.upsert({
      where: { firebaseUid: 'other-uid' },
      update: {},
      create: {
        firebaseUid: 'other-uid',
        email: 'other@example.com',
        username: 'otheruser',
        displayName: 'Other User'
      }
    })
  })

  const createFactBy = async (authorId: string): Promise<{ id: string }> => {
    return await prisma.fact.create({
      data: { authorId, content: 'A fact to be reposted' }
    })
  }

  describe('POST /facts/:factId/reposts', () => {
    it('should create a repost', async () => {
      const fact = await createFactBy('other-uid')

      const res = await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(201)
      expect(res.body.factId).toBe(fact.id)
      expect(res.body.userId).toBe('test-uid')
      expect(res.body.id).toBeDefined()
      expect(res.body.createdAt).toBeDefined()
    })

    it('should return 409 when already reposted', async () => {
      const fact = await createFactBy('other-uid')

      await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      const res = await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(409)
    })

    it('should return 400 when reposting own fact', async () => {
      const fact = await createFactBy('test-uid')

      const res = await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(400)
      expect(res.body.error_code).toBe('BAD_REQUEST')
    })

    it('should return 401 when not authenticated', async () => {
      const fact = await createFactBy('other-uid')

      const res = await request(app)
        .post(`/facts/${fact.id}/reposts`)

      expect(res.status).toBe(401)
    })

    it('should return 403 when user has no profile', async () => {
      const fact = await createFactBy('other-uid')

      const res = await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${noProfileToken}`)

      expect(res.status).toBe(403)
    })

    it('should return 404 for non-existent fact', async () => {
      const res = await request(app)
        .post('/facts/non-existent-id/reposts')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /facts/:factId/reposts', () => {
    it('should delete a repost', async () => {
      const fact = await createFactBy('other-uid')

      await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      const res = await request(app)
        .delete(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(204)
    })

    it('should return 404 when repost does not exist', async () => {
      const fact = await createFactBy('other-uid')

      const res = await request(app)
        .delete(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(404)
    })

    it('should return 401 when not authenticated', async () => {
      const fact = await createFactBy('other-uid')

      const res = await request(app)
        .delete(`/facts/${fact.id}/reposts`)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /facts/:factId/reposts', () => {
    it('should return reposts for a fact', async () => {
      const fact = await createFactBy('test-uid')

      await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${otherToken}`)

      const res = await request(app)
        .get(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBeGreaterThan(0)
      const item = res.body.results[0]
      expect(item.id).toBeDefined()
      expect(item.username).toBeDefined()
      expect(item.displayName).toBeDefined()
      expect(item.createdAt).toBeDefined()
    })

    it('should return empty array for fact with no reposts', async () => {
      const fact = await createFactBy('other-uid')

      const res = await request(app)
        .get(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBe(0)
    })

    it('should return 401 when not authenticated', async () => {
      const fact = await createFactBy('other-uid')

      const res = await request(app).get(`/facts/${fact.id}/reposts`)

      expect(res.status).toBe(401)
    })
  })
})
