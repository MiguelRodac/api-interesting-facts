import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { LikeNotFoundError } from '../../domain/errors/LikeNotFoundError'

export class DeleteRepostLike {
  private readonly likeRepository: LikeRepository

  constructor (likeRepository: LikeRepository) {
    this.likeRepository = likeRepository
  }

  async execute (userId: string, repostId: string): Promise<void> {
    const existingLike = await this.likeRepository.findByUserAndRepost(userId, repostId)

    if (existingLike == null) {
      throw new LikeNotFoundError()
    }

    await this.likeRepository.deleteRepostLike(userId, repostId)
  }
}
