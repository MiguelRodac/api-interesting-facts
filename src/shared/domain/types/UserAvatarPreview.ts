/**
 * Slim user preview for fact-card contexts (likeBy, commentsDetails).
 * No id, no displayName, no email — avoids PII exposure in list endpoints.
 */
export interface UserAvatarPreview {
  username: string
  avatarUrl: string | null
  avatarColor: string | null
}
