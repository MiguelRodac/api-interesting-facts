import { DeleteFact } from '../../src/feature/facts/application/use-cases/DeleteFact'
import { UpdateFact } from '../../src/feature/facts/application/use-cases/UpdateFact'
import { CreateFact } from '../../src/feature/facts/application/use-cases/CreateFact'
import { type FactRepository } from '../../src/feature/facts/domain/ports/FactRepository'
import { FactNotFoundError } from '../../src/feature/facts/domain/errors/FactNotFoundError'
import { FactForbiddenError } from '../../src/feature/facts/domain/errors/FactForbiddenError'
import { ContentTooShortError } from '../../src/feature/facts/domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../src/feature/facts/domain/errors/ContentTooLongError'
import { TitleTooLongError } from '../../src/feature/facts/domain/errors/TitleTooLongError'
import { FACT_CONTENT_MIN_LENGTH, FACT_CONTENT_MAX_LENGTH, FACT_TITLE_MAX_LENGTH } from '@shared/domain/validation'
import { type Fact } from '../../src/feature/facts/domain/entities/Fact'

// Mock prisma dependencies inside CreateFact / UpdateFact constructors
jest.mock('@hashtag/infrastructure/repositories/PrismaHashtagRepository', () => ({
  PrismaHashtagRepository: jest.fn().mockImplementation(() => ({
    extractHashtags: jest.fn().mockResolvedValue(['science']),
    syncFactHashtags: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('@mentions/infrastructure/repositories/PrismaMentionRepository', () => ({
  PrismaMentionRepository: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('@user/infrastructure/repositories/PrismaUserRepository', () => ({
  PrismaUserRepository: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('@mentions/application/MentionParser', () => ({
  MentionParser: jest.fn().mockImplementation(() => ({
    syncFactMentions: jest.fn().mockResolvedValue(undefined)
  }))
}))

describe('Fact Invariants and Business Rules (Unit)', () => {
  let mockFactRepo: jest.Mocked<FactRepository>

  const existingFact: Fact = {
    id: 'fact-1',
    authorId: 'author-1',
    title: 'Valid Title',
    content: 'This is a valid interesting fact with enough length.',
    createdAt: new Date('2026-01-01T12:00:00Z'),
    updatedAt: new Date('2026-01-01T12:00:00Z')
  }

  beforeEach(() => {
    mockFactRepo = {
      findById: jest.fn().mockResolvedValue(existingFact),
      create: jest.fn().mockResolvedValue(existingFact),
      update: jest.fn().mockResolvedValue(existingFact),
      delete: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<FactRepository>
  })

  describe('DeleteFact', () => {
    let deleteFact: DeleteFact

    beforeEach(() => {
      deleteFact = new DeleteFact(mockFactRepo)
    })

    it('should throw FactNotFoundError when fact does not exist', async () => {
      mockFactRepo.findById.mockResolvedValue(null)

      await expect(deleteFact.execute('nonexistent-id', 'author-1')).rejects.toThrow(FactNotFoundError)
      expect(mockFactRepo.delete).not.toHaveBeenCalled()
    })

    it('should throw FactForbiddenError when requester is not author', async () => {
      await expect(deleteFact.execute('fact-1', 'not-author')).rejects.toThrow(FactForbiddenError)
      expect(mockFactRepo.delete).not.toHaveBeenCalled()
    })

    it('should successfully delete fact when requester is author', async () => {
      await expect(deleteFact.execute('fact-1', 'author-1')).resolves.toBeUndefined()
      expect(mockFactRepo.delete).toHaveBeenCalledWith('fact-1')
    })
  })

  describe('UpdateFact', () => {
    let updateFact: UpdateFact

    beforeEach(() => {
      updateFact = new UpdateFact(mockFactRepo)
    })

    it('should throw FactNotFoundError when fact does not exist', async () => {
      mockFactRepo.findById.mockResolvedValue(null)

      await expect(updateFact.execute('nonexistent-id', { content: 'Valid updated content' }, 'author-1')).rejects.toThrow(FactNotFoundError)
    })

    it('should throw FactForbiddenError when requester is not author', async () => {
      await expect(updateFact.execute('fact-1', { content: 'Valid updated content' }, 'different-user')).rejects.toThrow(FactForbiddenError)
    })

    it('should throw TitleTooLongError when updated title exceeds max length', async () => {
      const longTitle = 'a'.repeat(FACT_TITLE_MAX_LENGTH + 1)
      await expect(updateFact.execute('fact-1', { title: longTitle }, 'author-1')).rejects.toThrow(TitleTooLongError)
    })

    it('should throw ContentTooShortError when updated content is too short', async () => {
      const shortContent = 'a'.repeat(FACT_CONTENT_MIN_LENGTH - 1)
      await expect(updateFact.execute('fact-1', { content: shortContent }, 'author-1')).rejects.toThrow(ContentTooShortError)
    })

    it('should throw ContentTooLongError when updated content exceeds max length', async () => {
      const longContent = 'a'.repeat(FACT_CONTENT_MAX_LENGTH + 1)
      await expect(updateFact.execute('fact-1', { content: longContent }, 'author-1')).rejects.toThrow(ContentTooLongError)
    })
  })

  describe('CreateFact', () => {
    let createFact: CreateFact

    beforeEach(() => {
      createFact = new CreateFact(mockFactRepo)
    })

    it('should throw ContentTooShortError when content length is below minimum', async () => {
      const shortContent = 'short'
      await expect(createFact.execute({ content: shortContent }, 'author-1')).rejects.toThrow(ContentTooShortError)
      expect(mockFactRepo.create).not.toHaveBeenCalled()
    })

    it('should throw ContentTooLongError when content length exceeds maximum', async () => {
      const longContent = 'a'.repeat(FACT_CONTENT_MAX_LENGTH + 1)
      await expect(createFact.execute({ content: longContent }, 'author-1')).rejects.toThrow(ContentTooLongError)
      expect(mockFactRepo.create).not.toHaveBeenCalled()
    })

    it('should throw TitleTooLongError when title exceeds maximum length', async () => {
      const longTitle = 'a'.repeat(FACT_TITLE_MAX_LENGTH + 1)
      await expect(createFact.execute({ title: longTitle, content: 'Valid content that has enough length' }, 'author-1')).rejects.toThrow(TitleTooLongError)
      expect(mockFactRepo.create).not.toHaveBeenCalled()
    })
  })
})
