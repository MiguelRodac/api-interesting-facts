import { type RepostRepository } from '../../domain/ports/RepostRepository'
import { RepostNotFoundError } from '../../domain/errors/RepostNotFoundError'

export class DeleteRepost {
  private readonly repostRepository: RepostRepository

  constructor (repostRepository: RepostRepository) {
    this.repostRepository = repostRepository
  }

  async execute (userId: string, originalFactId: string): Promise<void> {
    const existingRepost = await this.repostRepository.findByAuthorAndFact(userId, originalFactId)

    if (existingRepost == null) {
      throw new RepostNotFoundError()
    }

    await this.repostRepository.delete(userId, originalFactId)
  }
}
