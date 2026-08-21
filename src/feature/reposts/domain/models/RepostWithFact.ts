import { type Repost } from '../entities/Repost'

/**
 * Read model: a Repost enriched with the public preview of the user who reposted.
 * This is the source for the `repostedBy` field of a FeedEntry repost.
 * Assembled from reposts + users — not a persisted entity.
 */
export interface RepostWithFact extends Repost {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}
