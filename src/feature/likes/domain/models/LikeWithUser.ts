import { type Like } from '../entities/Like'

/**
 * Read model: a Like enriched with the public preview of the user who liked.
 * Assembled from likes + users — not a persisted entity.
 */
export interface LikeWithUser extends Like {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}