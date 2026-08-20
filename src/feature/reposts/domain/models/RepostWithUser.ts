import { type Repost } from '../entities/Repost'

/**
 * Read model: a Repost enriched with the public preview of the user who reposted.
 * Assembled from reposts + users — not a persisted entity.
 */
export interface RepostWithUser extends Repost {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}
