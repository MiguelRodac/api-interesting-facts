import request from 'supertest'
import { app, prisma } from '../setup'

describe('Likes Endpoints', () => {
  const validToken = 'valid-test-token'

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
    await prisma.fact.create({
      data: {
        authorId: 'test-uid',
        content: 'A fact to be liked'
      }
    })
  })

  // Helper that narrows type after explicit null check
  const getTestFactId = async (): Promise<string> => {
    const fact = await prisma.fact.findFirst()
    if (fact === null) throw new Error('Test setup failed: no fact found')
    return fact.id
  }

  describe('POST /facts/:factId/likes', () => {
    it('should create a like', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(201)
      expect(res.body.factId).toBe(factId)
      expect(res.body.userId).toBe('test-uid')
    })

    it('should return 409 when already liked', async () => {
      const factId = await getTestFactId()

      // First like
      await request(app)
        .post(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      // Second like should fail
      const res = await request(app)
        .post(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(409)
    })

    it('should return 401 when not authenticated', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/likes`)

      expect(res.status).toBe(401)
    })

    it('should return 404 for non-existent fact', async () => {
      const res = await request(app)
        .post('/facts/non-existent-id/likes')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /facts/:factId/likes', () => {
    it('should delete a like', async () => {
      const factId = await getTestFactId()

      // Create a like first
      await request(app)
        .post(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      // Delete it
      const res = await request(app)
        .delete(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(204)
    })

    it('should return 404 when like does not exist', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .delete(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(404)
    })

    it('should return 401 when not authenticated', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .delete(`/facts/${factId}/likes`)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /facts/:factId/likes', () => {
    it('should return likes for a fact', async () => {
      const factId = await getTestFactId()

      await request(app)
        .post(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      const res = await request(app).get(`/facts/${factId}/likes`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBeGreaterThan(0)
    })

    it('should return empty array for fact with no likes', async () => {
      const factId = await getTestFactId()

      const res = await request(app).get(`/facts/${factId}/likes`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBe(0)
    })
  })

  describe('GET /users/:userId/likes', () => {
    it('should return likes by a user', async () => {
      const factId = await getTestFactId()

      await request(app)
        .post(`/facts/${factId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)

      const res = await request(app).get('/users/test-uid/likes')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBeGreaterThan(0)
    })

    it('should return empty array for user with no likes', async () => {
      const res = await request(app).get('/users/test-uid/likes')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBe(0)
    })
  })
})
