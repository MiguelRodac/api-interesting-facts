import { extractMentionUsernames, MentionParser } from '../../src/feature/mentions/application/MentionParser'
import { type MentionRepository } from '../../src/feature/mentions/domain/ports/MentionRepository'
import { type UserRepository } from '../../src/feature/user/domain/ports/UserRepository'

describe('MentionParser (Unit)', () => {
  describe('extractMentionUsernames', () => {
    it('should extract single mention without @', () => {
      const result = extractMentionUsernames('Hello @miguel welcome!')
      expect(result).toEqual(['miguel'])
    })

    it('should extract multiple mentions and deduplicate them', () => {
      const result = extractMentionUsernames('Hey @alice and @bob, and again @alice!')
      expect(result).toEqual(['alice', 'bob'])
    })

    it('should support usernames with dots and underscores', () => {
      const result = extractMentionUsernames('Ping @john_doe and @jane.smith')
      expect(result).toEqual(['john_doe', 'jane.smith'])
    })

    it('should return empty array when no mentions are present', () => {
      const result = extractMentionUsernames('No mentions here at all')
      expect(result).toEqual([])
    })

    it('should ignore lone @ symbol with no following alphanumeric characters', () => {
      const result = extractMentionUsernames('just a lone @ and another @ without name')
      expect(result).toEqual([])
    })
  })

  describe('MentionParser use cases', () => {
    let mockMentionRepo: jest.Mocked<MentionRepository>
    let mockUserRepo: jest.Mocked<UserRepository>
    let mentionParser: MentionParser

    beforeEach(() => {
      mockMentionRepo = {
        replaceFactMentions: jest.fn().mockResolvedValue(undefined),
        replaceCommentMentions: jest.fn().mockResolvedValue(undefined),
        findByUserId: jest.fn()
      } as unknown as jest.Mocked<MentionRepository>

      mockUserRepo = {
        findUidsByUsernames: jest.fn(),
        findByFirebaseUid: jest.fn(),
        findByUsername: jest.fn(),
        findBySearch: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      } as unknown as jest.Mocked<UserRepository>

      mentionParser = new MentionParser(mockMentionRepo, mockUserRepo)
    })

    it('should resolve existing users and store fact mentions', async () => {
      const uidsMap = new Map<string, string>([
        ['alice', 'uid-alice'],
        ['bob', 'uid-bob']
      ])
      mockUserRepo.findUidsByUsernames.mockResolvedValue(uidsMap)

      await mentionParser.storeFactMentions('fact-1', 'author-1', 'Great post by @alice and @bob!')

      expect(mockUserRepo.findUidsByUsernames).toHaveBeenCalledWith(['alice', 'bob'])
      expect(mockMentionRepo.replaceFactMentions).toHaveBeenCalledWith('fact-1', 'author-1', ['uid-alice', 'uid-bob'])
    })

    it('should silently discard usernames that do not exist', async () => {
      // Only alice exists, ghost_user does not
      const uidsMap = new Map<string, string>([
        ['alice', 'uid-alice']
      ])
      mockUserRepo.findUidsByUsernames.mockResolvedValue(uidsMap)

      await mentionParser.storeFactMentions('fact-2', 'author-1', 'Mentioning @alice and @ghost_user')

      expect(mockMentionRepo.replaceFactMentions).toHaveBeenCalledWith('fact-2', 'author-1', ['uid-alice'])
    })

    it('should call replaceFactMentions with empty array if no mentions in text', async () => {
      await mentionParser.storeFactMentions('fact-3', 'author-1', 'Plain text without mentions')

      expect(mockUserRepo.findUidsByUsernames).not.toHaveBeenCalled()
      expect(mockMentionRepo.replaceFactMentions).toHaveBeenCalledWith('fact-3', 'author-1', [])
    })

    it('should store comment mentions correctly', async () => {
      const uidsMap = new Map<string, string>([
        ['charlie', 'uid-charlie']
      ])
      mockUserRepo.findUidsByUsernames.mockResolvedValue(uidsMap)

      await mentionParser.storeCommentMentions('comment-1', 'author-2', 'Replying to @charlie')

      expect(mockMentionRepo.replaceCommentMentions).toHaveBeenCalledWith('comment-1', 'author-2', ['uid-charlie'])
    })
  })
})
