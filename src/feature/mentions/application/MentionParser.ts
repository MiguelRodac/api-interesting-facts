import { type MentionRepository } from '../domain/ports/MentionRepository'
import { type UserRepository } from '../../user/domain/ports/UserRepository'

/**
 * Extracts @username mentions from a fact/comment content string.
 * Returns the deduplicated list of usernames (without the leading '@').
 */
export function extractMentionUsernames (content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_.]+)/g)
  if (matches === null) return []

  const usernames = matches.map(mention => mention.slice(1))
  return [...new Set(usernames)]
}

/**
 * Parses @mentions out of content and persists them (like Twitter: usernames
 * that do not resolve to an existing user are silently ignored).
 */
export class MentionParser {
  private readonly mentionRepository: MentionRepository
  private readonly userRepository: UserRepository

  constructor (mentionRepository: MentionRepository, userRepository: UserRepository) {
    this.mentionRepository = mentionRepository
    this.userRepository = userRepository
  }

  private async resolveUids (usernames: string[]): Promise<string[]> {
    const uidsByUsername = await this.userRepository.findUidsByUsernames(usernames)
    // Drop usernames that don't resolve to an existing user
    const uids = usernames
      .map(username => uidsByUsername.get(username))
      .filter((uid): uid is string => uid !== undefined)
    return [...new Set(uids)]
  }

  async storeFactMentions (factId: string, authorId: string, content: string): Promise<void> {
    const usernames = extractMentionUsernames(content)
    let uids: string[] = []
    if (usernames.length > 0) {
      uids = await this.resolveUids(usernames)
    }
    await this.mentionRepository.replaceFactMentions(factId, authorId, uids)
  }

  async storeCommentMentions (commentId: string, authorId: string, content: string): Promise<void> {
    const usernames = extractMentionUsernames(content)
    let uids: string[] = []
    if (usernames.length > 0) {
      uids = await this.resolveUids(usernames)
    }
    await this.mentionRepository.replaceCommentMentions(commentId, authorId, uids)
  }
}
