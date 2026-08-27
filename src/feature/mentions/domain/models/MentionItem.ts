import { type FactView } from '@fact/domain/models/FactView'

/**
 * Read model for a social mention: the fact or comment where a user was @mentioned.
 * `author` is the user who wrote the fact/comment (who mentioned), and `fact`
 * carries the full enriched FactView so the frontend can render standard FactCard components.
 */
export interface MentionAuthor {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}

export interface MentionCommentPayload {
  id: string
  content: string
  factId: string | null
  repostId: string | null
  author: MentionAuthor
  createdAt: Date
}

export interface MentionItem {
  id: string
  type: 'fact' | 'comment'
  author: MentionAuthor
  createdAt: Date
  fact?: FactView
  comment?: MentionCommentPayload
}
