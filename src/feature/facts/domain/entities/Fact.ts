export interface Fact {
  id: string
  authorId: string
  title: string | null
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateFactData {
  authorId: string
  title?: string
  content: string
}

export interface UpdateFactData {
  title?: string
  content?: string
}
