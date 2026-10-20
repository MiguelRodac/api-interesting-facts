import { DeleteComment } from '../../src/feature/comments/application/use-cases/DeleteComment'
import { UpdateComment } from '../../src/feature/comments/application/use-cases/UpdateComment'
import { type CommentRepository } from '../../src/feature/comments/domain/ports/CommentRepository'
import { type MentionRepository } from '../../src/feature/mentions/domain/ports/MentionRepository'
import { CommentNotFoundError } from '../../src/feature/comments/domain/errors/CommentNotFoundError'
import { CommentForbiddenError } from '../../src/feature/comments/domain/errors/CommentForbiddenError'
import { EditWindowExpiredError } from '../../src/feature/comments/domain/errors/EditWindowExpiredError'
import { ContentTooLongError } from '../../src/feature/comments/domain/errors/ContentTooLongError'
import { ContentTooShortError } from '../../src/feature/comments/domain/errors/ContentTooShortError'
import { DELETE_BLOCKED_HAS_REPLIES } from '@shared/domain/errors/authorization-error-codes'

describe('Comment Rules (Unit)', () => {
  let mockCommentRepo: jest.Mocked<CommentRepository>
  let mockMentionRepo: jest.Mocked<MentionRepository>

  beforeEach(() => {
    mockCommentRepo = {
      findById: jest.fn(),
      findByFactId: jest.fn(),
      findByRepostId: jest.fn(),
      findByAuthorId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countRepliesByParentId: jest.fn(),
      countLikesByCommentIds: jest.fn().mockResolvedValue(new Map()),
      findRecentLikersByCommentIds: jest.fn().mockResolvedValue(new Map()),
      findViewerLikedComments: jest.fn().mockResolvedValue(new Set())
    } as unknown as jest.Mocked<CommentRepository>

    mockMentionRepo = {
      replaceFactMentions: jest.fn().mockResolvedValue(undefined),
      replaceCommentMentions: jest.fn().mockResolvedValue(undefined),
      findByUserId: jest.fn()
    } as unknown as jest.Mocked<MentionRepository>
  })

  describe('DeleteComment rules', () => {
    let deleteComment: DeleteComment

    beforeEach(() => {
      deleteComment = new DeleteComment(mockCommentRepo)
    })

    it('should throw CommentNotFoundError when comment does not exist', async () => {
      mockCommentRepo.findById.mockResolvedValue(null)

      await expect(deleteComment.execute('comment-1', 'author-1')).rejects.toThrow(CommentNotFoundError)
      expect(mockCommentRepo.delete).not.toHaveBeenCalled()
    })

    it('should throw CommentForbiddenError when user is not the comment author', async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: 'comment-1',
        authorId: 'different-author',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      await expect(deleteComment.execute('comment-1', 'author-1')).rejects.toThrow(CommentForbiddenError)
      expect(mockCommentRepo.delete).not.toHaveBeenCalled()
    })

    it('should throw DELETE_BLOCKED_HAS_REPLIES when third parties have replied to the comment', async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: 'comment-1',
        authorId: 'author-1',
        content: 'Original comment',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // 2 replies from other users
      mockCommentRepo.countRepliesByParentId.mockResolvedValue(2)

      const executePromise = deleteComment.execute('comment-1', 'author-1')

      await expect(executePromise).rejects.toThrow(CommentForbiddenError)
      await expect(executePromise).rejects.toMatchObject({
        errorCode: DELETE_BLOCKED_HAS_REPLIES,
        message: 'Cannot delete comment: other users have replied'
      })
      expect(mockCommentRepo.delete).not.toHaveBeenCalled()
    })

    it('should successfully delete comment when author matches and there are no replies from others', async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: 'comment-1',
        authorId: 'author-1',
        content: 'Comment to delete',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      mockCommentRepo.countRepliesByParentId.mockResolvedValue(0)
      mockCommentRepo.delete.mockResolvedValue(undefined as any)

      await expect(deleteComment.execute('comment-1', 'author-1')).resolves.toBeUndefined()
      expect(mockCommentRepo.delete).toHaveBeenCalledWith('comment-1')
    })
  })

  describe('UpdateComment rules', () => {
    let updateComment: UpdateComment

    beforeEach(() => {
      updateComment = new UpdateComment(mockCommentRepo, mockMentionRepo)
    })

    it('should throw CommentNotFoundError when comment does not exist', async () => {
      mockCommentRepo.findById.mockResolvedValue(null)

      await expect(updateComment.execute('c-1', 'author-1', 'New text')).rejects.toThrow(CommentNotFoundError)
    })

    it('should throw CommentForbiddenError when user is not author', async () => {
      mockCommentRepo.findById.mockResolvedValue({
        id: 'c-1',
        authorId: 'other-user',
        content: 'Existing text',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      await expect(updateComment.execute('c-1', 'author-1', 'New text')).rejects.toThrow(CommentForbiddenError)
    })

    it('should short-circuit and return without writing to DB if content is identical', async () => {
      const now = new Date()
      mockCommentRepo.findById.mockResolvedValue({
        id: 'c-1',
        authorId: 'author-1',
        content: 'Exact same content',
        createdAt: now,
        updatedAt: now
      } as any)

      const result = await updateComment.execute('c-1', 'author-1', '  Exact same content  ')

      expect(result.content).toBe('Exact same content')
      expect(mockCommentRepo.update).not.toHaveBeenCalled()
    })

    it('should throw EditWindowExpiredError when comment was created more than 1 hour ago', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      mockCommentRepo.findById.mockResolvedValue({
        id: 'c-1',
        authorId: 'author-1',
        content: 'Old comment',
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo
      } as any)

      await expect(updateComment.execute('c-1', 'author-1', 'Updated text')).rejects.toThrow(EditWindowExpiredError)
      expect(mockCommentRepo.update).not.toHaveBeenCalled()
    })

    it('should throw ContentTooShortError when new content is empty', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      mockCommentRepo.findById.mockResolvedValue({
        id: 'c-1',
        authorId: 'author-1',
        content: 'Old comment text',
        createdAt: fiveMinutesAgo,
        updatedAt: fiveMinutesAgo
      } as any)

      await expect(updateComment.execute('c-1', 'author-1', '   ')).rejects.toThrow(ContentTooShortError)
    })

    it('should throw ContentTooLongError when new content exceeds max length', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      mockCommentRepo.findById.mockResolvedValue({
        id: 'c-1',
        authorId: 'author-1',
        content: 'Old comment text',
        createdAt: fiveMinutesAgo,
        updatedAt: fiveMinutesAgo
      } as any)

      const over500Chars = 'a'.repeat(501)
      await expect(updateComment.execute('c-1', 'author-1', over500Chars)).rejects.toThrow(ContentTooLongError)
    })

    it('should successfully update comment within 1 hour window', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const now = new Date()
      mockCommentRepo.findById.mockResolvedValue({
        id: 'c-1',
        authorId: 'author-1',
        content: 'Old comment text',
        createdAt: tenMinutesAgo,
        updatedAt: tenMinutesAgo
      } as any)

      mockCommentRepo.update.mockResolvedValue({
        id: 'c-1',
        authorId: 'author-1',
        content: 'Brand new updated comment text',
        createdAt: tenMinutesAgo,
        updatedAt: now
      } as any)

      const result = await updateComment.execute('c-1', 'author-1', 'Brand new updated comment text')

      expect(mockCommentRepo.update).toHaveBeenCalledWith('c-1', { content: 'Brand new updated comment text' })
      expect(result.content).toBe('Brand new updated comment text')
      expect(result.edited).toBe(true)
    })
  })
})
