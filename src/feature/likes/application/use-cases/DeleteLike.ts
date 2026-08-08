import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { LikeNotFoundError } from '../../../../shared/domain/errors/LikeNotFoundError'

export class DeleteLike {
  private readonly likeRepository: LikeRepository

  constructor (likeRepository: LikeRepository) {
    this.likeRepository = likeRepository
  }

  async execute (userId: string, factId: string): Promise<void> {
    const existingLike = await this.likeRepository.findByUserAndFact(userId, factId)

    if (existingLike == null) {
      throw new LikeNotFoundError()
    }

    await this.likeRepository.delete(userId, factId)
  }
}
