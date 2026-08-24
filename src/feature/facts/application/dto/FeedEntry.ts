import { type FactResponse } from './FactResponse'
import { type RepostResponse } from './RepostResponse'

export type FeedEntry =
  | { type: 'fact', fact: FactResponse, createdAt: string }
  | { type: 'repost', repost: RepostResponse, createdAt: string }
