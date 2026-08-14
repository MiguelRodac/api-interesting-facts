export interface User {
  id: string // Firebase UID as primary key
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
  createdAt: Date
}

export interface CreateUserData {
  firebaseUid: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
}

export interface UpdateUserData {
  displayName?: string
  avatarUrl?: string
  avatarColor?: string | null
}
