import { type FactResponse } from './FactResponse'

export interface RepostAuthor {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
  isMe: boolean
}

export type FeedEntry =
  | { type: 'fact', fact: FactResponse, createdAt: string }
  | { type: 'repost', fact: FactResponse, repostedBy: RepostAuthor, createdAt: string }
