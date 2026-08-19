import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'

/**
 * Preview of the first top-level comment on a fact.
 * Embedded in FactResponse.commentsDetails.
 * `replies` is a count, not the array — frontend fetches full thread on expand.
 */
export interface CommentPreview {
  id: string
  content: string
  author: UserAvatarPreview
  parentCommentId: string | null // always null (top-level only)
  replies: number
  createdAt: string
}
