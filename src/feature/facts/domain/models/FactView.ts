/**
 * Read model: fact enriched with author preview and optional viewer's like status.
 * Assembled from facts, users, and likes tables — not a persisted entity.
 */
export interface FactView {
  id: string
  authorId: string
  author: { id: string, username: string, email: string, displayName: string }
  title: string | null
  content: string
  likes: number
  liked?: boolean
  hashtags: Array<{ id: string, tag: string }>
  createdAt: Date
  updatedAt: Date
}
