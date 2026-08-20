/**
 * RepostResponse mirrors LikeResponse exactly: { id, userId, factId, createdAt }.
 * The Repost entity keeps originalFactId/authorId; mapRepost renames at the boundary.
 */
export interface RepostResponse {
  id: string
  userId: string
  factId: string
  createdAt: string
}

/**
 * Author preview shape for a reposter.
 */
export interface RepostAuthorPreview {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}

/**
 * Response shape for GET /facts/:factId/reposts: a Repost enriched with
 * the public preview of the user who reposted. Mirrors LikePreviewResponse.
 */
export interface RepostPreviewResponse {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
  createdAt: string
}
