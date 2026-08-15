import { type User, type CreateUserData, type UpdateUserData } from '../entities/User'

export interface UserRepository {
  findById: (id: string) => Promise<User | null>
  findByFirebaseUid: (firebaseUid: string) => Promise<User | null>
  findByUsername: (username: string) => Promise<User | null>
  findByEmail: (email: string) => Promise<User | null>
  findBySearch: (query: string) => Promise<User[]>
  existsByUsername: (username: string) => Promise<boolean>
  existsByEmail: (email: string) => Promise<boolean>
  create: (data: CreateUserData) => Promise<User>
  update: (id: string, data: UpdateUserData) => Promise<User>
}
