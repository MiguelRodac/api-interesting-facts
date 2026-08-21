/**
 * Read model for a social mention: the fact or comment where a user was @mentioned.
 * `author` is the user who wrote the fact/comment (who mentioned), and the nested
 * `fact`/`comment` payload carries the source content so the frontend can render it.
 * This is assembled from mentions + facts/comments + users — not a persisted entity.
 */
export interface MentionAuthor {
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}

export interface MentionFactPayload {
  id: string
  title: string | null
  content: string
}

export interface MentionCommentPayload {
  id: string
  content: string
  factId: string
}

export interface MentionItem {
  id: string
  type: 'fact' | 'comment'
  author: MentionAuthor
  createdAt: Date
  fact?: MentionFactPayload
  comment?: MentionCommentPayload
}
