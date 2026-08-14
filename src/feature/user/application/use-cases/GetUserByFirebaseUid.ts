import { type UserRepository } from '../../domain/ports/UserRepository'
import { type UserResponse } from '../dto/UserResponse'
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError'

export class GetUserByFirebaseUid {
  private readonly userRepository: UserRepository

  constructor (userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  async execute (uid: string): Promise<UserResponse> {
    const user = await this.userRepository.findByFirebaseUid(uid)

    if (user == null) {
      throw new UserNotFoundError()
    }

    return {
      firebaseUid: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    }
  }
}
