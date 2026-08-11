import request from 'supertest'
import { app, prisma } from '../setup'

describe('Users Endpoints', () => {
  describe('GET /users/:username', () => {
    it('should return public profile by username', async () => {
      // Create a user directly in DB
      await prisma.user.create({
        data: {
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
      await prisma.user.create({
        data: {
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
})
