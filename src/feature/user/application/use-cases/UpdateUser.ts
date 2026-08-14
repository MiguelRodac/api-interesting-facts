import { type UserRepository } from '../../domain/ports/UserRepository'
import { type UpdateUserInput } from '../dto/UpdateUserInput'
import { type UserResponse } from '../dto/UserResponse'

export class UpdateUser {
  constructor (private readonly repository: UserRepository) {}

  async execute (firebaseUid: string, data: UpdateUserInput): Promise<UserResponse> {
    const user = await this.repository.update(firebaseUid, {
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      avatarColor: data.avatarColor
    })

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
