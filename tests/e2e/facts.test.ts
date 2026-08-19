import request from 'supertest'
import { app, prisma } from '../setup'

describe('Facts Endpoints', () => {
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
        username: 'testauthor',
        displayName: 'Test Author'
      }
    })
    await prisma.user.upsert({
      where: { firebaseUid: 'other-uid' },
      update: {},
      create: {
        firebaseUid: 'other-uid',
        email: 'other@example.com',
        username: 'otherauthor',
        displayName: 'Other Author'
      }
    })
  })

  describe('POST /facts', () => {
    it('should create a fact with valid data', async () => {
      const res = await request(app)
        .post('/facts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          content: 'This is a valid fact with more than 10 characters'
        })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        content: 'This is a valid fact with more than 10 characters',
        author: { id: 'test-uid' }
      })
      expect(res.body.id).toBeDefined()
      expect(res.body.createdAt).toBeDefined()
    })

    it('should create a fact with title and content', async () => {
      const res = await request(app)
        .post('/facts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Title',
          content: 'This is a valid fact with more than 10 characters'
        })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        title: 'Test Title',
        content: 'This is a valid fact with more than 10 characters',
        author: { id: 'test-uid' }
      })
    })

    it('should return 400 for content too short', async () => {
      const res = await request(app)
        .post('/facts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'short' })

      expect(res.status).toBe(400)
      expect(res.body.error_code).toBe('BAD_REQUEST')
    })

    it('should return 400 for content too long', async () => {
      const res = await request(app)
        .post('/facts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'x'.repeat(1001) })

      expect(res.status).toBe(400)
      expect(res.body.error_code).toBe('BAD_REQUEST')
    })

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/facts')
        .send({ content: 'Some fact content here' })

      expect(res.status).toBe(401)
    })

    it('should return 403 when user has no profile', async () => {
      const res = await request(app)
        .post('/facts')
        .set('Authorization', `Bearer ${noProfileToken}`)
        .send({ content: 'Some fact content here' })

      expect(res.status).toBe(403)
    })
  })

  describe('GET /facts', () => {
    it('should return all facts', async () => {
      // Create a fact first
      await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'A public fact'
        }
      })

      const res = await request(app).get('/facts')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBeGreaterThan(0)
      expect(res.body.page).toBe(1)
      expect(res.body.limit).toBe(20)
    })

    it('should return empty array beyond last page', async () => {
      // A page beyond any data guarantees empty results without assuming the DB is clean
      const res = await request(app).get('/facts?page=999')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBe(0)
    })
  })

  describe('GET /facts/popular', () => {
    it('should return facts sorted by likes count', async () => {
      // Create facts
      const fact1 = await prisma.fact.create({
        data: { authorId: 'test-uid', content: 'Fact with no likes' }
      })
      const fact2 = await prisma.fact.create({
        data: { authorId: 'test-uid', content: 'Fact with 2 likes' }
      })
      const fact3 = await prisma.fact.create({
        data: { authorId: 'test-uid', content: 'Fact with 1 like' }
      })

      // Add likes: fact2 has 2, fact3 has 1, fact1 has 0
      await prisma.like.createMany({
        data: [
          { userId: 'test-uid', factId: fact2.id },
          { userId: 'other-uid', factId: fact2.id },
          { userId: 'test-uid', factId: fact3.id }
        ]
      })

      const res = await request(app).get('/facts/popular')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)

      // Locate own test facts in the full result set (other real facts may exist)
      const results = res.body.results as Array<{ id: string }>
      const idxOf = (id: string): number => results.findIndex(r => r.id === id)
      expect(idxOf(fact2.id)).toBeGreaterThanOrEqual(0)
      expect(idxOf(fact3.id)).toBeGreaterThanOrEqual(0)
      expect(idxOf(fact1.id)).toBeGreaterThanOrEqual(0)
      // Most liked first among own facts
      expect(idxOf(fact2.id)).toBeLessThan(idxOf(fact3.id))
      expect(idxOf(fact3.id)).toBeLessThan(idxOf(fact1.id))
    })

    it('should return empty array beyond last page', async () => {
      const res = await request(app).get('/facts/popular?page=999')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.results)).toBe(true)
      expect(res.body.results.length).toBe(0)
    })
  })

  describe('GET /facts/:id', () => {
    it('should return a fact by id', async () => {
      const fact = await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'A specific fact'
        }
      })

      const res = await request(app).get(`/facts/${fact.id}`)

      expect(res.status).toBe(200)
      expect(res.body.content).toBe('A specific fact')
      expect(res.body.author.id).toBe('test-uid')
    })

    it('should return 404 for non-existent fact', async () => {
      const res = await request(app).get('/facts/non-existent-id')
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /facts/:id', () => {
    it('should update fact when author', async () => {
      const fact = await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'Original content here'
        }
      })

      const res = await request(app)
        .patch(`/facts/${fact.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'Updated content here' })

      expect(res.status).toBe(200)
      expect(res.body.content).toBe('Updated content here')
    })

    it('should return 403 when non-author tries to update', async () => {
      const fact = await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'Original content'
        }
      })

      const res = await request(app)
        .patch(`/facts/${fact.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Hacked content' })

      expect(res.status).toBe(403)
    })

    it('should return 401 when not authenticated', async () => {
      const fact = await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'Original content'
        }
      })

      const res = await request(app)
        .patch(`/facts/${fact.id}`)
        .send({ content: 'Updated content' })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /facts/:id', () => {
    it('should delete fact when author', async () => {
      const fact = await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'To be deleted'
        }
      })

      const res = await request(app)
        .delete(`/facts/${fact.id}`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(204)

      // Verify fact is deleted
      const deletedFact = await prisma.fact.findUnique({ where: { id: fact.id } })
      expect(deletedFact).toBeNull()
    })

    it('should return 403 when non-author tries to delete', async () => {
      const fact = await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'Protected content'
        }
      })

      const res = await request(app)
        .delete(`/facts/${fact.id}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })

    it('should return 401 when not authenticated', async () => {
      const fact = await prisma.fact.create({
        data: {
          authorId: 'test-uid',
          content: 'Protected content'
        }
      })

      const res = await request(app)
        .delete(`/facts/${fact.id}`)

      expect(res.status).toBe(401)
    })
  })

  describe('FactResponse enrichment — comments + likeBy', () => {
    // Creates a fact with 2 likes and 1 top-level comment + 1 reply,
    // then asserts the enrichment fields across every read path.
    const seedFact = async (): Promise<{ id: string }> => {
      const fact = await prisma.fact.create({
        data: { authorId: 'test-uid', content: 'Per path enrichment fact body' }
      })

      await prisma.like.createMany({
        data: [
          { userId: 'test-uid', factId: fact.id },
          { userId: 'other-uid', factId: fact.id }
        ]
      })

      const topLevel = await prisma.comment.create({
        data: { content: 'Per path top-level comment', factId: fact.id, authorId: 'test-uid' }
      })
      await prisma.comment.create({
        data: { content: 'Per path reply comment', factId: fact.id, authorId: 'test-uid', parentCommentId: topLevel.id }
      })

      return fact
    }

    const assertEnrichment = (fact: { likeBy: unknown[], comments: number, commentsDetails: { replies: number } | null }): void => {
      expect(fact.likeBy).toHaveLength(2)
      expect(fact.comments).toBe(2)
      expect(fact.commentsDetails).not.toBeNull()
      expect(fact.commentsDetails?.replies).toBe(1)
    }

    it('findById — GET /facts/:id', async () => {
      const fact = await seedFact()

      const res = await request(app).get(`/facts/${fact.id}`)

      expect(res.status).toBe(200)
      assertEnrichment(res.body)
    })

    it('findByAuthorId — GET /facts/author/:authorId', async () => {
      const fact = await seedFact()

      const res = await request(app).get(`/facts/author/test-uid`)

      expect(res.status).toBe(200)
      const found = res.body.results.find((r: { id: string }) => r.id === fact.id)
      expect(found).toBeDefined()
      assertEnrichment(found)
    })

    it('findAll — GET /facts', async () => {
      const fact = await seedFact()

      const res = await request(app).get('/facts')

      expect(res.status).toBe(200)
      const found = res.body.results.find((r: { id: string }) => r.id === fact.id)
      expect(found).toBeDefined()
      assertEnrichment(found)
    })

    it('findPopular — GET /facts/popular', async () => {
      const fact = await seedFact()

      const res = await request(app).get('/facts/popular')

      expect(res.status).toBe(200)
      const found = res.body.results.find((r: { id: string }) => r.id === fact.id)
      expect(found).toBeDefined()
      assertEnrichment(found)
    })

    it('findByTitleOrHashtag — GET /facts/search (plain query)', async () => {
      const fact = await prisma.fact.create({
        data: { authorId: 'test-uid', content: 'Enrichment title search body', title: 'Per Path Title' }
      })
      await prisma.like.createMany({
        data: [
          { userId: 'test-uid', factId: fact.id },
          { userId: 'other-uid', factId: fact.id }
        ]
      })
      const topLevel = await prisma.comment.create({
        data: { content: 'Per path top-level comment', factId: fact.id, authorId: 'test-uid' }
      })
      await prisma.comment.create({
        data: { content: 'Per path reply comment', factId: fact.id, authorId: 'test-uid', parentCommentId: topLevel.id }
      })

      const res = await request(app)
        .get('/facts/search?q=Per%20Path%20Title&limit=100')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      const found = res.body.facts.find((r: { id: string }) => r.id === fact.id)
      expect(found).toBeDefined()
      assertEnrichment(found)
    })

    it('findByAuthorOrMention — GET /facts/search (mention)', async () => {
      const fact = await seedFact()

      const res = await request(app)
        .get('/facts/search?q=%40testauthor&limit=100')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      const found = res.body.facts.find((r: { id: string }) => r.id === fact.id)
      expect(found).toBeDefined()
      assertEnrichment(found)
    })

    it('findByHashtag — GET /facts/search (hashtag)', async () => {
      const fact = await seedFact()
      const hashtag = await prisma.hashtag.upsert({
        where: { tag: 'enrichmenttag' },
        update: {},
        create: { tag: 'enrichmenttag' }
      })
      await prisma.factHashtag.create({ data: { factId: fact.id, hashtagId: hashtag.id } })

      const res = await request(app)
        .get('/facts/search?q=%23enrichmenttag&limit=100')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      const found = res.body.facts.find((r: { id: string }) => r.id === fact.id)
      expect(found).toBeDefined()
      assertEnrichment(found)

      // Clean up the test-created hashtag fixture so it doesn't persist in the DB.
      await prisma.factHashtag.deleteMany({ where: { hashtagId: hashtag.id } })
      await prisma.hashtag.deleteMany({ where: { tag: 'enrichmenttag' } })
    })
  })
})
