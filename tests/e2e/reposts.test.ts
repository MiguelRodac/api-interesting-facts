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
    await prisma.user.upsert({
      where: { firebaseUid: 'third-uid' },
      update: {},
      create: {
        firebaseUid: 'third-uid',
        email: 'third@example.com',
        username: 'thirduser',
        displayName: 'Third User'
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

  describe('GET /facts — unified feed with reposts', () => {
    const reposter = async (): Promise<{ username: string, displayName: string }> => {
      const user = await prisma.user.findUnique({ where: { firebaseUid: 'test-uid' } })
      return { username: user?.username ?? '', displayName: user?.displayName ?? '' }
    }

    it('should surface reposts as repost feed entries', async () => {
      const fact = await createFactBy('other-uid')
      const author = await reposter()

      await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      const res = await request(app).get('/facts')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)

      const repostEntry = res.body.results.find(
        (r: { type: string, repost: { factId: string } }) => r.type === 'repost' && r.repost.factId === fact.id
      )
      expect(repostEntry).toBeDefined()
      expect(repostEntry.repost).toBeDefined()
      expect(repostEntry.repost.content).toBe('A fact to be reposted')
      expect(repostEntry.repost.repostedBy).toMatchObject({
        username: author.username,
        displayName: author.displayName,
        isMe: false
      })
      expect(repostEntry.createdAt).toBeDefined()
    }, 20000)

    it('should show facts of the profile plus reposts made by that author', async () => {
      const fact = await createFactBy('other-uid')
      const author = await reposter()

      await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      const res = await request(app).get('/facts/author/test-uid')
      expect(res.status).toBe(200)

      const repostEntry = res.body.results.find(
        (r: { type: string, repost: { factId: string } }) => r.type === 'repost' && r.repost.factId === fact.id
      )
      expect(repostEntry).toBeDefined()
      expect(repostEntry.repost.content).toBe('A fact to be reposted')
      expect(repostEntry.repost.repostedBy).toMatchObject({ username: author.username, isMe: false })
    }, 20000)

    it('should mark a repost as isMe when viewer is the reposter', async () => {
      const fact = await createFactBy('other-uid')

      await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)

      const res = await request(app)
        .get('/facts')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      const repostEntry = res.body.results.find(
        (r: { type: string, repost: { factId: string } }) => r.type === 'repost' && r.repost.factId === fact.id
      )
      expect(repostEntry).toBeDefined()
      expect(repostEntry.repost.repostedBy.isMe).toBe(true)
    }, 20000)
  })

  describe('GET /reposts/:repostId', () => {
    it('should return repost detail with original fact content', async () => {
      const fact = await createFactBy('other-uid')
      const repostRes = await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)
      const repostId = repostRes.body.id as string

      const res = await request(app)
        .get(`/reposts/${repostId}`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(repostId)
      expect(res.body.factId).toBe(fact.id)
      expect(res.body.content).toBe('A fact to be reposted')
      expect(res.body.author).toBeDefined()
      expect(res.body.repostedBy).toMatchObject({
        username: 'testuser',
        isMe: true
      })
      expect(res.body.repostLikeCount).toBe(0)
      expect(res.body.likeBy).toEqual([])
      expect(res.body.liked).toBe(false)
      expect(res.body.createdAt).toBeDefined()
    }, 20000)

    it('should return liked and likeBy when repost has likes', async () => {
      const fact = await createFactBy('other-uid')
      const repostRes = await request(app)
        .post(`/facts/${fact.id}/reposts`)
        .set('Authorization', `Bearer ${validToken}`)
      const repostId = repostRes.body.id as string

      await request(app)
        .post(`/reposts/${repostId}/likes`)
        .set('Authorization', `Bearer ${validToken}`)
      await request(app)
        .post(`/reposts/${repostId}/likes`)
        .set('Authorization', `Bearer ${otherToken}`)

      const res = await request(app)
        .get(`/reposts/${repostId}`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.repostLikeCount).toBe(2)
      expect(res.body.liked).toBe(true)
      expect(res.body.likeBy).toHaveLength(2)
      expect(res.body.likeBy[0]).toHaveProperty('username')
      expect(res.body.likeBy[0]).toHaveProperty('avatarUrl')
      expect(res.body.likeBy[0]).toHaveProperty('avatarColor')
    }, 20000)

    it('should return 404 for non-existent repost', async () => {
      const res = await request(app)
        .get('/reposts/non-existent-id')

      expect(res.status).toBe(404)
    })
  })
})
