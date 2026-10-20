import { FeedHydrator, type PaginationEntry } from '../../src/feature/facts/application/services/FeedHydrator'
import { type FactRepository, type EnrichmentMaps } from '../../src/feature/facts/domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FactView } from '../../src/feature/facts/domain/models/FactView'
import { type RepostWithFact } from '@reposts/domain/models/RepostWithFact'

describe('FeedHydrator (Unit)', () => {
  let mockFactRepo: jest.Mocked<FactRepository>
  let mockRepostRepo: jest.Mocked<RepostRepository>
  let mockLikeRepo: jest.Mocked<LikeRepository>
  let mockCommentRepo: jest.Mocked<CommentRepository>
  let hydrator: FeedHydrator

  const dummyEnrichmentMaps: EnrichmentMaps = {
    likeCountMap: new Map(),
    commentCountMap: new Map(),
    likeByMap: new Map(),
    commentsDetailsMap: new Map(),
    repostCountMap: new Map(),
    repostByMap: new Map(),
    hashtagsMap: new Map()
  }

  const sampleFactView: FactView = {
    id: 'fact-1',
    authorId: 'author-1',
    author: {
      id: 'author-1',
      username: 'factauthor',
      email: 'author@test.com',
      displayName: 'Fact Author',
      avatarUrl: null,
      avatarColor: '#abcdef'
    },
    title: 'Interesting Science',
    content: 'Did you know that octopuses have three hearts?',
    likes: 5,
    comments: 2,
    repostCount: 1,
    likeBy: [],
    commentsDetails: null,
    repostBy: [],
    hashtags: [{ id: 'tag-1', tag: 'science' }],
    createdAt: new Date('2026-01-01T12:00:00Z'),
    updatedAt: new Date('2026-01-01T12:00:00Z')
  }

  const sampleRepost: RepostWithFact = {
    id: 'repost-1',
    originalFactId: 'fact-1',
    authorId: 'reposter-uid',
    username: 'reposter',
    displayName: 'Reposter Name',
    avatarUrl: 'https://example.com/avatar.png',
    avatarColor: '#123456',
    createdAt: new Date('2026-01-02T12:00:00Z')
  }

  beforeEach(() => {
    mockFactRepo = {
      findRawByIds: jest.fn().mockResolvedValue([
        {
          id: 'fact-1',
          authorId: 'author-1',
          author: {
            firebaseUid: 'author-1',
            username: 'factauthor',
            email: 'author@test.com',
            displayName: 'Fact Author',
            avatarUrl: null,
            avatarColor: '#abcdef'
          },
          title: 'Interesting Science',
          content: 'Did you know that octopuses have three hearts?',
          createdAt: new Date('2026-01-01T12:00:00Z'),
          updatedAt: new Date('2026-01-01T12:00:00Z')
        }
      ]),
      batchBuildEnrichmentMaps: jest.fn().mockResolvedValue(dummyEnrichmentMaps),
      batchEnrichFacts: jest.fn().mockResolvedValue([sampleFactView])
    } as unknown as jest.Mocked<FactRepository>

    mockRepostRepo = {
      findByIdsWithFact: jest.fn().mockResolvedValue([sampleRepost])
    } as unknown as jest.Mocked<RepostRepository>

    mockLikeRepo = {
      batchLikeCountsByRepostIds: jest.fn().mockResolvedValue(new Map([['repost-1', 10]])),
      batchRecentRepostLikers: jest.fn().mockResolvedValue(new Map([['repost-1', []]])),
      batchUserRepostLikes: jest.fn().mockResolvedValue(new Set(['repost-1']))
    } as unknown as jest.Mocked<LikeRepository>

    mockCommentRepo = {
      batchCommentCountsByRepostIds: jest.fn().mockResolvedValue(new Map([['repost-1', 3]])),
      batchFirstCommentByRepostIds: jest.fn().mockResolvedValue(new Map([['repost-1', null]]))
    } as unknown as jest.Mocked<CommentRepository>

    hydrator = new FeedHydrator(
      mockFactRepo,
      mockRepostRepo,
      mockLikeRepo,
      mockCommentRepo
    )
  })

  it('should return empty array when given no pagination entries', async () => {
    const result = await hydrator.hydrate([])
    expect(result).toEqual([])
    expect(mockFactRepo.findRawByIds).not.toHaveBeenCalled()
  })

  it('should hydrate a fact entry and map to standard feed DTO', async () => {
    const entries: PaginationEntry[] = [
      {
        id: 'fact-1',
        type: 'fact',
        originalFactId: 'fact-1',
        authorId: 'author-1',
        createdAt: new Date('2026-01-01T12:00:00.000Z')
      }
    ]

    const result = await hydrator.hydrate(entries, 'viewer-123')

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('fact')
    if (result[0].type === 'fact') {
      expect(result[0].fact.id).toBe('fact-1')
      expect(result[0].fact.title).toBe('Interesting Science')
      expect(result[0].fact.author.username).toBe('factauthor')
      expect(result[0].createdAt).toBe('2026-01-01T12:00:00.000Z')
    }
    expect(mockFactRepo.findRawByIds).toHaveBeenCalledWith(['fact-1'])
  })

  it('should hydrate a repost entry and attach reposter metrics and isMe flag', async () => {
    const entries: PaginationEntry[] = [
      {
        id: 'repost-1',
        type: 'repost',
        originalFactId: 'fact-1',
        authorId: 'reposter-uid',
        createdAt: '2026-01-02T12:00:00.000Z'
      }
    ]

    // Viewer is the reposter
    const result = await hydrator.hydrate(entries, 'reposter-uid')

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('repost')
    if (result[0].type === 'repost') {
      expect(result[0].repost.id).toBe('repost-1')
      expect(result[0].repost.factId).toBe('fact-1')
      expect(result[0].repost.repostedBy.username).toBe('reposter')
      expect(result[0].repost.repostedBy.isMe).toBe(true)
      expect(result[0].repost.repostLikeCount).toBe(10)
      expect(result[0].repost.repostCommentCount).toBe(3)
      expect(result[0].repost.liked).toBe(true)
    }
  })

  it('should set isMe=false when viewer is not the reposter', async () => {
    const entries: PaginationEntry[] = [
      {
        id: 'repost-1',
        type: 'repost',
        originalFactId: 'fact-1',
        authorId: 'reposter-uid',
        createdAt: '2026-01-02T12:00:00.000Z'
      }
    ]

    const result = await hydrator.hydrate(entries, 'different-viewer')

    expect(result).toHaveLength(1)
    if (result[0].type === 'repost') {
      expect(result[0].repost.repostedBy.isMe).toBe(false)
    }
  })

  it('should skip entries whose original fact is missing from repository', async () => {
    mockFactRepo.batchEnrichFacts.mockResolvedValue([])

    const entries: PaginationEntry[] = [
      {
        id: 'fact-missing',
        type: 'fact',
        originalFactId: 'fact-missing',
        authorId: 'author-1',
        createdAt: '2026-01-01T12:00:00.000Z'
      }
    ]

    const result = await hydrator.hydrate(entries)
    expect(result).toEqual([])
  })

  it('should preserve original chronological entry order when mixing facts and reposts', async () => {
    const entries: PaginationEntry[] = [
      {
        id: 'repost-1',
        type: 'repost',
        originalFactId: 'fact-1',
        authorId: 'reposter-uid',
        createdAt: '2026-01-02T12:00:00.000Z'
      },
      {
        id: 'fact-1',
        type: 'fact',
        originalFactId: 'fact-1',
        authorId: 'author-1',
        createdAt: '2026-01-01T12:00:00.000Z'
      }
    ]

    const result = await hydrator.hydrate(entries)

    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('repost')
    expect(result[1].type).toBe('fact')
  })
})
