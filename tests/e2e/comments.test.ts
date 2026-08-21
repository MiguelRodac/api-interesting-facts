import request from 'supertest'
import { app, prisma } from '../setup'

describe('Comments Endpoints', () => {
  const validToken = 'valid-test-token'
  const otherToken = 'other-valid-token'
  const noProfileToken = 'no-profile-token'

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
  })

  const getTestFactId = async (): Promise<string> => {
    const fact = await prisma.fact.create({
      data: { authorId: 'test-uid', content: 'A fact to comment on' }
    })
    return fact.id
  }

  const createComment = (factId: string, content = 'This is a valid comment', authorId = 'test-uid'): Promise<{ id: string }> =>
    prisma.comment.create({
      data: { content, factId, authorId }
    })

  describe('POST /facts/:factId/comments', () => {
    it('should create a top-level comment', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This is a valid top-level comment' })

      expect(res.status).toBe(201)
      expect(res.body.parentCommentId).toBeNull()
      expect(res.body.content).toBe('This is a valid top-level comment')
    })

    it('should create a reply to a top-level comment', async () => {
      const factId = await getTestFactId()
      const topLevel = await createComment(factId)

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This is a valid reply comment', parentCommentId: topLevel.id })

      expect(res.status).toBe(201)
      expect(res.body.parentCommentId).toBe(topLevel.id)
    })

    it('should reject a reply to a reply', async () => {
      const factId = await getTestFactId()
      const topLevel = await createComment(factId)
      const reply = await createComment(factId, 'This is a nested reply comment')
      await prisma.comment.update({ where: { id: reply.id }, data: { parentCommentId: topLevel.id } })

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This reply targets another reply', parentCommentId: reply.id })

      expect(res.status).toBe(400)
      expect(res.body.error_code).toBe('BAD_REQUEST')
    })

    it('should reject a cross-fact reply', async () => {
      const factA = await getTestFactId()
      const factB = await getTestFactId()
      const topLevel = await createComment(factA)

      const res = await request(app)
        .post(`/facts/${factB}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'Cross fact reply comment', parentCommentId: topLevel.id })

      expect(res.status).toBe(400)
      expect(res.body.error_code).toBe('BAD_REQUEST')
    })

    it('should reject content too short', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: '   ' })

      expect(res.status).toBe(400)
      expect(res.body.error_code).toBe('BAD_REQUEST')
    })

    it('should reject content too long', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'x'.repeat(501) })

      expect(res.status).toBe(400)
      expect(res.body.error_code).toBe('BAD_REQUEST')
    })

    it('should reject invalid mentions', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This mentions an invalid @x' })

      expect(res.status).toBe(422)
      expect(res.body.error_code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 when not authenticated', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .send({ content: 'This is a valid comment text' })

      expect(res.status).toBe(401)
    })

    it('should return 403 when user has no profile', async () => {
      const factId = await getTestFactId()

      const res = await request(app)
        .post(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${noProfileToken}`)
        .send({ content: 'This is a valid comment text' })

      expect(res.status).toBe(403)
    })

    it('should return 404 for non-existent fact', async () => {
      const res = await request(app)
        .post('/facts/non-existent-id/comments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This is a valid comment text' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /comments/:id', () => {
    it('should delete own comment', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId)

      const res = await request(app)
        .delete(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(204)

      const deleted = await prisma.comment.findUnique({ where: { id: comment.id } })
      expect(deleted).toBeNull()
    })

    it('should cascade delete replies', async () => {
      const factId = await getTestFactId()
      const topLevel = await createComment(factId)
      const reply = await createComment(factId, 'This is a reply to be cascaded')
      await prisma.comment.update({ where: { id: reply.id }, data: { parentCommentId: topLevel.id } })

      const res = await request(app)
        .delete(`/comments/${topLevel.id}`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(204)

      const deletedReply = await prisma.comment.findUnique({ where: { id: reply.id } })
      expect(deletedReply).toBeNull()
    })

    it('should return 403 when not the author', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId)

      const res = await request(app)
        .delete(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.status).toBe(403)
    })

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .delete('/comments/non-existent-id')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(404)
    })

    it('should return 401 when not authenticated', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId)

      const res = await request(app).delete(`/comments/${comment.id}`)

      expect(res.status).toBe(401)
    })

    it('should block deletion when another user has replied', async () => {
      const factId = await getTestFactId()
      const topLevel = await createComment(factId)
      const otherReply = await prisma.comment.create({
        data: { content: 'Reply from another user', factId, authorId: 'other-uid', parentCommentId: topLevel.id }
      })

      const res = await request(app)
        .delete(`/comments/${topLevel.id}`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(403)
      expect(res.body.error_code).toBe('DELETE_BLOCKED_HAS_REPLIES')

      const keptTopLevel = await prisma.comment.findUnique({ where: { id: topLevel.id } })
      expect(keptTopLevel).not.toBeNull()
      const keptReply = await prisma.comment.findUnique({ where: { id: otherReply.id } })
      expect(keptReply).not.toBeNull()
    })
  })

  describe('PATCH /comments/:id', () => {
    it('should update own comment within the edit window', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId, 'Original comment content')

      const res = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This is the updated comment content' })

      expect(res.status).toBe(200)
      expect(res.body.content).toBe('This is the updated comment content')
      expect(res.body.edited).toBe(true)
    })

    it('should be idempotent when content is unchanged', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId, 'This comment stays the same')

      const res = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This comment stays the same' })

      expect(res.status).toBe(200)
      expect(res.body.content).toBe('This comment stays the same')
      expect(res.body.edited).toBe(false)
    })

    it('should return 403 when the edit window has expired', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId, 'This comment is older than an hour')
      await prisma.comment.update({
        where: { id: comment.id },
        data: { createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      })

      const res = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This update is now too late' })

      expect(res.status).toBe(403)
      expect(res.body.error_code).toBe('EDIT_WINDOW_EXPIRED')
    })

    it('should return 403 when not the author', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId)

      const res = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Someone elses attempt to edit' })

      expect(res.status).toBe(403)
      expect(res.body.error_code).toBe('FORBIDDEN')
    })

    it('should return 401 when not authenticated', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId)

      const res = await request(app)
        .patch(`/comments/${comment.id}`)
        .send({ content: 'No token edit attempt' })

      expect(res.status).toBe(401)
    })

    it('should return 403 when user has no profile', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId)

      const res = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${noProfileToken}`)
        .send({ content: 'No profile edit attempt' })

      expect(res.status).toBe(403)
    })

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .patch('/comments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'Edit a comment that does not exist' })

      expect(res.status).toBe(404)
      expect(res.body.error_code).toBe('RESOURCE_NOT_FOUND')
    })

    it('should return 422 for invalid mentions', async () => {
      const factId = await getTestFactId()
      const comment = await createComment(factId)

      const res = await request(app)
        .patch(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'This content mentions an invalid @x!' })

      expect(res.status).toBe(422)
      expect(res.body.error_code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /facts/:factId/comments', () => {
    it('should return threaded comments with replies', async () => {
      const factId = await getTestFactId()
      const topLevel = await createComment(factId, 'First top-level comment')
      const reply = await createComment(factId, 'First reply comment')
      await prisma.comment.update({ where: { id: reply.id }, data: { parentCommentId: topLevel.id } })
      await createComment(factId, 'Second top-level comment')

      const res = await request(app)
        .get(`/facts/${factId}/comments`)
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.results.length).toBe(2)

      const first = res.body.results.find((c: { content: string }) => c.content === 'First top-level comment')
      expect(first).toBeDefined()
      expect(first.replies.length).toBe(1)
      expect(first.replies[0].content).toBe('First reply comment')
    })

    it('should return 200 for fact with no comments', async () => {
      const factId = await getTestFactId()

      const res = await request(app).get(`/facts/${factId}/comments`)

      expect(res.status).toBe(200)
      expect(res.body.results.length).toBe(0)
      expect(res.body.nextPage).toBeNull()
    })

    it('should return 200 without auth (optionalAuth)', async () => {
      const factId = await getTestFactId()
      await createComment(factId)

      const res = await request(app).get(`/facts/${factId}/comments`)

      expect(res.status).toBe(200)
    })

    it('should return 404 for non-existent fact', async () => {
      const res = await request(app).get('/facts/non-existent-id/comments')

      expect(res.status).toBe(404)
    })
  })

  describe('GET /users/:userId/comments', () => {
    it('should return flat list of comments by a user', async () => {
      const factId = await getTestFactId()
      await createComment(factId)
      await createComment(factId, 'Second comment by user')

      const res = await request(app)
        .get('/users/test-uid/comments')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.results.length).toBe(2)
      expect(res.body.results.every((c: { factId: string }) => c.factId === factId)).toBe(true)
    })

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/users/test-uid/comments')

      expect(res.status).toBe(401)
    })
  })
})
