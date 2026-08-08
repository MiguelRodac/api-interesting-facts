import { type User, type CreateUserData, type UpdateUserData } from '../entities/User'

export interface UserRepository {
  findById: (id: string) => Promise<User | null>
  findByFirebaseUid: (firebaseUid: string) => Promise<User | null>
  findByUsername: (username: string) => Promise<User | null>
  create: (data: CreateUserData) => Promise<User>
  update: (id: string, data: UpdateUserData) => Promise<User>
}
