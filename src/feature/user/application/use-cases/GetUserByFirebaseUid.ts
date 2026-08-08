import { type UserRepository } from '../../domain/ports/UserRepository'
import { type UserResponse } from '../dto/UserResponse'
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError'

export class GetUserByFirebaseUid {
  private readonly userRepository: UserRepository

  constructor (userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  async execute (uid: string): Promise<UserResponse> {
    const user = await this.userRepository.findByFirebaseUid(uid)

    if (user == null) {
      throw new NotFoundError('User not found')
    }

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
