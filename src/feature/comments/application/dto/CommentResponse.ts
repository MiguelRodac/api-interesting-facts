import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'

/**
 * Full comment response DTO for endpoint responses.
 * `replies` is only populated on GET /facts/:factId/comments (threaded).
 * `factId` is present on flat reads (user feed); omitted on fact-scoped threaded reads.
 * `likesCount`, `liked` and `likeBy` are viewer-aware enrichment (comment reads require auth).
 */
export interface CommentAuthorPreview {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}

export interface CommentResponse {
  id: string
  content: string
  author: CommentAuthorPreview
  parentCommentId: string | null
  factId?: string
  createdAt: string
  updatedAt: string
  edited: boolean
  likesCount: number
  liked: boolean
  likeBy: UserAvatarPreview[]
  replies?: CommentResponse[]
}
