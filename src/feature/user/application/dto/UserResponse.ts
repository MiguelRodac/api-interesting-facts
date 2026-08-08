export interface UserResponse {
  firebaseUid: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  createdAt: Date
}
