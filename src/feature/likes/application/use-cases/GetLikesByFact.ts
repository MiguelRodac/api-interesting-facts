import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type LikeResponse } from '../dto/LikeResponse'

export class GetLikesByFact {
  private readonly likeRepository: LikeRepository

  constructor (likeRepository: LikeRepository) {
    this.likeRepository = likeRepository
  }

  async execute (factId: string): Promise<LikeResponse[]> {
    const likes = await this.likeRepository.findByFactId(factId)

    return likes.map(like => ({
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      createdAt: like.createdAt.toISOString()
    }))
  }
}
