import { type UserRepository } from '../../domain/ports/UserRepository'
import { type PublicUserResponse } from '../dto/PublicUserResponse'
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError'

export class GetUserByUsername {
  constructor (private readonly repository: UserRepository) {}

  async execute (username: string): Promise<PublicUserResponse> {
    const user = await this.repository.findByUsername(username)

    if (user == null) {
      throw new UserNotFoundError(`User '${username}' not found`)
    }

    return {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt.toISOString()
    }
  }
}
