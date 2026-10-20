import { CreateRepost } from '../../src/feature/reposts/application/use-cases/CreateRepost'
import { type RepostRepository } from '../../src/feature/reposts/domain/ports/RepostRepository'
import { type FactRepository } from '../../src/feature/facts/domain/ports/FactRepository'
import { FactNotFoundError } from '../../src/feature/facts/domain/errors/FactNotFoundError'
import { RepostSelfError } from '../../src/feature/reposts/domain/errors/RepostSelfError'
import { RepostAlreadyExistsError } from '../../src/feature/reposts/domain/errors/RepostAlreadyExistsError'
import { Prisma } from '@prisma/client'

describe('Repost Rules (Unit)', () => {
  let mockRepostRepo: jest.Mocked<RepostRepository>
  let mockFactRepo: jest.Mocked<FactRepository>
  let createRepost: CreateRepost

  beforeEach(() => {
    mockRepostRepo = {
      findById: jest.fn(),
      findByFactAndUser: jest.fn(),
      findByFactId: jest.fn(),
      findAllWithFact: jest.fn(),
      findByIdsWithFact: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<RepostRepository>

    mockFactRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<FactRepository>

    createRepost = new CreateRepost(mockRepostRepo, mockFactRepo)
  })

  it('should throw FactNotFoundError when target fact does not exist', async () => {
    mockFactRepo.findById.mockResolvedValue(null)

    await expect(createRepost.execute('user-1', 'fact-999')).rejects.toThrow(FactNotFoundError)
    expect(mockRepostRepo.create).not.toHaveBeenCalled()
  })

  it('should throw RepostSelfError when author attempts to repost their own fact', async () => {
    mockFactRepo.findById.mockResolvedValue({
      id: 'fact-1',
      authorId: 'user-1', // same as current user
      content: 'My own fact',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any)

    await expect(createRepost.execute('user-1', 'fact-1')).rejects.toThrow(RepostSelfError)
    expect(mockRepostRepo.create).not.toHaveBeenCalled()
  })

  it('should throw RepostAlreadyExistsError when unique constraint fails (race condition)', async () => {
    mockFactRepo.findById.mockResolvedValue({
      id: 'fact-2',
      authorId: 'user-2', // different author
      content: 'Another fact',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any)

    const prismaUniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0'
    })
    mockRepostRepo.create.mockRejectedValue(prismaUniqueError)

    await expect(createRepost.execute('user-1', 'fact-2')).rejects.toThrow(RepostAlreadyExistsError)
  })

  it('should create repost and return DTO when fact exists and is from another author', async () => {
    const now = new Date()
    mockFactRepo.findById.mockResolvedValue({
      id: 'fact-3',
      authorId: 'user-2',
      content: 'Great fact',
      createdAt: now,
      updatedAt: now
    } as any)

    mockRepostRepo.create.mockResolvedValue({
      id: 'repost-123',
      authorId: 'user-1',
      originalFactId: 'fact-3',
      createdAt: now
    } as any)

    const result = await createRepost.execute('user-1', 'fact-3')

    expect(result).toEqual({
      id: 'repost-123',
      userId: 'user-1',
      factId: 'fact-3',
      createdAt: now.toISOString()
    })
  })
})
