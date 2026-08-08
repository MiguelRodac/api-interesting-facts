import request from 'supertest'
import { app } from '../setup'

describe('Auth Endpoints', () => {
  const validToken = 'valid-test-token'
  const invalidToken = 'invalid-test-token'

  describe('POST /auth/profile', () => {
    it('should create user profile with valid data', async () => {
      const res = await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          username: 'testuser',
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.png'
        })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png'
      })
    })

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/auth/profile')
        .send({ username: 'test', displayName: 'Test' })

      expect(res.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ username: 'test', displayName: 'Test' })

      expect(res.status).toBe(401)
    })

    it('should return 400 for missing username', async () => {
      const res = await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ displayName: 'Test' })

      expect(res.status).toBe(400)
    })

    it('should return 400 for missing displayName', async () => {
      const res = await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ username: 'testuser2' })

      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid username format (too short)', async () => {
      const res = await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ username: 'ab', displayName: 'Test' })

      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid username format (special chars)', async () => {
      const res = await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ username: 'test@user!', displayName: 'Test' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /auth/me', () => {
    it('should return current user when authenticated', async () => {
      // First create the user
      await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ username: 'meuser', displayName: 'Me User' })

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        username: 'meuser',
        displayName: 'Me User'
      })
    })

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/auth/me')
      expect(res.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)

      expect(res.status).toBe(401)
    })
  })

  describe('PATCH /auth/me', () => {
    it('should update profile with valid data', async () => {
      // First create the user
      await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ username: 'updateuser', displayName: 'Old Name' })

      const res = await request(app)
        .patch('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ displayName: 'New Name', avatarUrl: 'https://example.com/new.png' })

      expect(res.status).toBe(200)
      expect(res.body.displayName).toBe('New Name')
      expect(res.body.avatarUrl).toBe('https://example.com/new.png')
    })

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/auth/me')
        .send({ displayName: 'New Name' })

      expect(res.status).toBe(401)
    })

    it('should return 403 when user has no profile (not onboarded)', async () => {
      const res = await request(app)
        .patch('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ displayName: 'New Name' })

      expect(res.status).toBe(403)
    })
  })
})
