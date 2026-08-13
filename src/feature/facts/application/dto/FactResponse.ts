export interface FactAuthorPreview {
  id: string
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
  liked?: boolean
  createdAt: string
  updatedAt: string
}
