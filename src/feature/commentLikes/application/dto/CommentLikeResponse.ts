export interface CommentLikeResponse {
  id: string
  userId: string
  commentId: string
  factId: string
  createdAt: string
}

/**
 * Response shape for `GET /facts/:factId/comments/:commentId/likes`: a CommentLike
 * enriched with the public preview of the user who liked. The factId/commentId are
 * implicit in the URL, so they are omitted; userId is omitted in favor of the public
 * username/displayName so consumers never see the Firebase uid.
 */
export interface CommentLikePreviewResponse {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
  createdAt: string
}
