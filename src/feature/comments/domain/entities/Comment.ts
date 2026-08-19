export interface Comment {
  id: string
  content: string
  factId: string
  authorId: string
  parentCommentId: string | null
  createdAt: Date
  updatedAt: Date
}
