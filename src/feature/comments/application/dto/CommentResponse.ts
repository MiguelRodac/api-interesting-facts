/**
 * Full comment response DTO for endpoint responses.
 * `replies` is only populated on GET /facts/:factId/comments (threaded).
 * `factId` is present on flat reads (user feed); omitted on fact-scoped threaded reads.
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
  replies?: CommentResponse[]
}
