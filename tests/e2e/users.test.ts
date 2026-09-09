import request from 'supertest'
import { app, prisma } from '../setup'

describe('Users Endpoints', () => {
  const validToken = 'valid-test-token'

  describe('GET /users/:username', () => {
    it('should return public profile by username', async () => {
      await prisma.user.upsert({
        where: { firebaseUid: 'public-user-uid' },
        update: {},
        create: {
          firebaseUid: 'public-user-uid',
          email: 'public@example.com',
          username: 'publicuser',
          displayName: 'Public User'
        }
      })

      const res = await request(app).get('/users/publicuser')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        username: 'publicuser',
        displayName: 'Public User'
      })
      // Email should NOT be exposed in public profile
      expect(res.body.email).toBeUndefined()
    })

    it('should return 404 for non-existent username', async () => {
      const res = await request(app).get('/users/nonexistent')

      expect(res.status).toBe(404)
      expect(res.body.error_code).toBe('RESOURCE_NOT_FOUND')
    })

    it('should return public profile without authentication', async () => {
      await prisma.user.upsert({
        where: { firebaseUid: 'another-user-uid' },
        update: {},
        create: {
          firebaseUid: 'another-user-uid',
          email: 'another@example.com',
          username: 'anotheruser',
          displayName: 'Another User',
          avatarUrl: 'https://example.com/avatar.png'
        }
      })

      const res = await request(app).get('/users/anotheruser')

      expect(res.status).toBe(200)
      expect(res.body.username).toBe('anotheruser')
      expect(res.body.displayName).toBe('Another User')
      expect(res.body.avatarUrl).toBe('https://example.com/avatar.png')
    })
  })

  describe('GET /users/search', () => {
    beforeEach(async () => {
      await prisma.user.upsert({
        where: { firebaseUid: 'search-user-1' },
        update: {},
        create: {
          firebaseUid: 'search-user-1',
          email: 'search1@example.com',
          username: 'autocompletesearch1',
          displayName: 'Search Alpha'
        }
      })
      await prisma.user.upsert({
        where: { firebaseUid: 'search-user-2' },
        update: {},
        create: {
          firebaseUid: 'search-user-2',
          email: 'search2@example.com',
          username: 'autocompletesearch2',
          displayName: 'Search Beta'
        }
      })
    })

    it('should return standardized pagination wrapper', async () => {
      const res = await request(app)
        .get('/users/search?q=autocompletesearch&page=1&limit=1')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('results')
      expect(res.body).toHaveProperty('page', 1)
      expect(res.body).toHaveProperty('limit', 1)
      expect(res.body).toHaveProperty('hasMore', true)
      expect(res.body.results).toHaveLength(1)
      expect(res.body.results[0]).toMatchObject({
        id: expect.any(String),
        username: expect.stringContaining('autocompletesearch'),
        displayName: expect.any(String)
      })
    })

    it('should return 422 when query parameter q is missing', async () => {
      const res = await request(app)
        .get('/users/search')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(422)
    })
  })

  describe('GET /auth (mention autocomplete)', () => {
    it('should return standardized pagination wrapper', async () => {
      const res = await request(app)
        .get('/auth?q=autocompletesearch&page=1&limit=10')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('results')
      expect(res.body).toHaveProperty('page', 1)
      expect(res.body).toHaveProperty('limit', 10)
      expect(res.body).toHaveProperty('hasMore', false)
      expect(Array.isArray(res.body.results)).toBe(true)
    })
  })

  describe('GET /hashtags', () => {
    beforeEach(async () => {
      const tag1 = await prisma.hashtag.upsert({
        where: { tag: 'populartag1' },
        update: {},
        create: { tag: 'populartag1' }
      })
      const fact = await prisma.fact.create({
        data: {
          authorId: 'search-user-1',
          content: 'Fact with hashtag for test'
        }
      })
      await prisma.factHashtag.create({
        data: {
          factId: fact.id,
          hashtagId: tag1.id
        }
      })
    })

    it('should return standardized pagination wrapper with usage counts', async () => {
      const res = await request(app)
        .get('/hashtags?q=populartag&page=1&limit=10')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('results')
      expect(res.body).toHaveProperty('page', 1)
      expect(res.body).toHaveProperty('limit', 10)
      expect(res.body).toHaveProperty('hasMore', false)
      expect(res.body.results.length).toBeGreaterThanOrEqual(1)
      expect(res.body.results[0]).toMatchObject({
        id: expect.any(String),
        tag: expect.stringContaining('populartag'),
        usageCount: expect.any(Number)
      })
    })
  })
})
