export interface FactAuthorPreview {
  username: string
  email: string
  displayName: string
}

export interface FactResponse {
  id: string
  author: FactAuthorPreview
  title: string | null
  content: string
  likes: number
  createdAt: string
  updatedAt: string
}
