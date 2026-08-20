/**
 * Read model: fact enriched with author preview and optional viewer's like status.
 * Assembled from facts, users, and likes tables — not a persisted entity.
 */
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { type CommentPreview } from '@comments/application/dto/CommentPreview'

export interface FactView {
  id: string
  authorId: string
  author: { id: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
  title: string | null
  content: string
  likes: number
  liked?: boolean
  likeBy: UserAvatarPreview[]
  comments: number
  commentsDetails: CommentPreview | null
  repostCount: number
  repostedByMe?: boolean
  repostBy: UserAvatarPreview[]
  hashtags: Array<{ id: string, tag: string }>
  createdAt: Date
  updatedAt: Date
}
