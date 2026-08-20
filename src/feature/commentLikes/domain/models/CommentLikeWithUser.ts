import { type CommentLike } from '../entities/CommentLike'

/**
 * Read model: a CommentLike enriched with the public preview of the user who liked.
 * Assembled from comment_likes + users — not a persisted entity.
 */
export interface CommentLikeWithUser extends CommentLike {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}
