export interface LikeResponse {
  id: string
  userId: string
  factId: string
  createdAt: string
}

/**
 * Response shape for `GET /facts/:factId/likes`: a Like enriched with
 * the public preview of the user who liked. The factId is implicit in
 * the URL, so it is omitted; userId is omitted in favor of the public
 * username/displayName so consumers never see the Firebase uid.
 */
export interface LikePreviewResponse {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
  createdAt: string
}