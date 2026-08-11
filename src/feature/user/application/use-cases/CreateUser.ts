import { type UserRepository } from '../../domain/ports/UserRepository'
import { type CreateUserData } from '../../domain/entities/User'
import { type CreateUserInput } from '../dto/CreateUserInput'
import { type UserResponse } from '../dto/UserResponse'
import { ConflictError } from '@shared/domain/errors/ConflictError'

export class CreateUser {
  private readonly userRepository: UserRepository

  constructor (userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  async execute (data: CreateUserInput, uid: string, email: string): Promise<UserResponse> {
    const existingByUid = await this.userRepository.findByFirebaseUid(uid)

    if (existingByUid != null) {
      throw new ConflictError('User already exists')
    }

    const existingByUsername = await this.userRepository.findByUsername(data.username)

    if (existingByUsername != null) {
      throw new ConflictError('Username is already taken')
    }

    const createData: CreateUserData = {
      firebaseUid: uid,
      email,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl
    }

    const user = await this.userRepository.create(createData)

    return {
      firebaseUid: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt
    }
  }
}
