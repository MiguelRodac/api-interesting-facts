export interface Comment {
  id: string
  content: string
  factId: string | null
  repostId: string | null
  authorId: string
  parentCommentId: string | null
  createdAt: Date
  updatedAt: Date
}
