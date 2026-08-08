import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type LikeResponse } from '../dto/LikeResponse'

export class GetLikesByUser {
  private readonly likeRepository: LikeRepository

  constructor (likeRepository: LikeRepository) {
    this.likeRepository = likeRepository
  }

  async execute (userId: string): Promise<LikeResponse[]> {
    const likes = await this.likeRepository.findByUserId(userId)

    return likes.map(like => ({
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      createdAt: like.createdAt.toISOString()
    }))
  }
}
