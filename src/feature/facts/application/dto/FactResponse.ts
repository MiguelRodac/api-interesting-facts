export interface FactAuthorPreview {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
}

export interface HashtagPreview {
  id: string
  tag: string
}

export interface FactResponse {
  id: string
  author: FactAuthorPreview
  title: string | null
  content: string
  likes: number
  liked?: boolean
  hashtags: HashtagPreview[]
  createdAt: string
  updatedAt: string
}
