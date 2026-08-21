import request from 'supertest'
import { app, prisma } from '../setup'

describe('Mentions Endpoints', () => {
  const validToken = 'valid-test-token'

  beforeEach(async () => {
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
    // The user who gets mentioned
    await prisma.user.upsert({
      where: { firebaseUid: 'another-user-uid' },
      update: {},
      create: {
        firebaseUid: 'another-user-uid',
        email: 'another@example.com',
        username: 'mentioneduser',
        displayName: 'Mentioned User'
      }
    })
  })

  const getTestFactId = async (): Promise<string> => {
    const fact = await prisma.fact.create({
      data: { authorId: 'test-uid', content: 'A fact to comment on' }
    })
    return fact.id
  }

  const createFact = async (content: string): Promise<{ id: string }> => {
    const res = await request(app)
      .post('/facts')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ content })
    expect(res.status).toBe(201)
    return res.body
  }

  describe('GET /users/:username/mentions', () => {
    it('should list a fact where the user was @mentioned', async () => {
      await createFact('Hello @mentioneduser this is a very nice fact body')

      const res = await request(app)
        .get('/users/mentioneduser/mentions')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.results.length).toBe(1)
      const result = res.body.results[0]
      expect(result.type).toBe('fact')
      expect(result.author.username).toBe('testauthor')
      expect(result.fact.content).toContain('@mentioneduser')
      expect(result.createdAt).toBeDefined()
      expect(res.body.page).toBe(1)
      expect(res.body.limit).toBe(20)
      expect(res.body.nextPage).toBeNull()
    })

    it('should ignore mentions of non-existent users without error', async () => {
      const created = await createFact('Nothing to see here except @ghostuser ok')

      expect(created.id).toBeDefined()

      const res = await request(app)
        .get('/users/mentioneduser/mentions')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.results.length).toBe(0)
    })

    it('should ignore non-existent users but keep existing ones', async () => {
      await createFact('Hi @mentioneduser and @ghostuser with enough content')

      const res = await request(app)
        .get('/users/mentioneduser/mentions')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.results.length).toBe(1)
      expect(res.body.results[0].type).toBe('fact')
    })

    it('should list a comment where the user was @mentioned', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'Replying to mention @mentioneduser' })

      expect(res.status).toBe(201)

      const mentions = await request(app)
        .get('/users/mentioneduser/mentions')
        .set('Authorization', `Bearer ${validToken}`)

      expect(mentions.status).toBe(200)
      expect(mentions.body.results.length).toBe(1)
      expect(mentions.body.results[0].type).toBe('comment')
      expect(mentions.body.results[0].comment.content).toBe('Replying to mention @mentioneduser')
    })

    it('should paginate with the given limit', async () => {
      // Two facts mentioning the same user
      await createFact('First @mentioneduser mention with enough chars')
      await createFact('Second @mentioneduser mention with enough chars')

      const res = await request(app)
        .get('/users/mentioneduser/mentions?limit=1')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.results.length).toBe(1)
      expect(res.body.limit).toBe(1)
      expect(res.body.page).toBe(1)
      expect(res.body.nextPage).toBe(2)

      const page2 = await request(app)
        .get('/users/mentioneduser/mentions?limit=1&page=2')
        .set('Authorization', `Bearer ${validToken}`)

      expect(page2.status).toBe(200)
      expect(page2.body.results.length).toBe(1)
      expect(page2.body.page).toBe(2)
      expect(page2.body.nextPage).toBeNull()
    })

    it('should return 404 for non-existent username', async () => {
      const res = await request(app)
        .get('/users/doesnotexistuser/mentions')

      expect(res.status).toBe(404)
    })

    it('should return 400 for invalid username', async () => {
      const res = await request(app)
        .get('/users/x/mentions')

      expect(res.status).toBe(422)
    })
  })
})
