/** Input for the CreateComment use case. */
export interface CreateCommentInput {
  content: string
  parentCommentId?: string
}
