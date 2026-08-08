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
        authorId: 'test-uid'
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
        authorId: 'test-uid'
      })
    })

    it('should return 400 for content too short', async () => {
      const res = await request(app)
        .post('/facts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'short' })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('CONTENT_TOO_SHORT')
    })

    it('should return 400 for content too long', async () => {
      const res = await request(app)
        .post('/facts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'x'.repeat(201) })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('CONTENT_TOO_LONG')
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
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('should return empty array when no facts', async () => {
      const res = await request(app).get('/facts')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(0)
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
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(3)
      // Most liked first
      expect(res.body[0].id).toBe(fact2.id)
      expect(res.body[1].id).toBe(fact3.id)
      expect(res.body[2].id).toBe(fact1.id)
    })

    it('should return empty array when no facts', async () => {
      const res = await request(app).get('/facts/popular')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(0)
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
      expect(res.body.authorId).toBe('test-uid')
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
        .put(`/facts/${fact.id}`)
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
        .put(`/facts/${fact.id}`)
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
        .put(`/facts/${fact.id}`)
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
})
