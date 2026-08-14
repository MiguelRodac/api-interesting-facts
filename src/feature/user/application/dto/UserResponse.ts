export interface UserResponse {
  firebaseUid: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string | null
  createdAt: Date
}
