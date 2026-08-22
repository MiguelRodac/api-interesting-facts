import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type RepostRepository } from '../../../reposts/domain/ports/RepostRepository'
import { type LikeResponse } from '../dto/LikeResponse'
import { RepostNotFoundError } from '../../../reposts/domain/errors/RepostNotFoundError'
import { LikeAlreadyExistsError } from '../../domain/errors/LikeAlreadyExistsError'

export class CreateRepostLike {
  private readonly likeRepository: LikeRepository
  private readonly repostRepository: RepostRepository

  constructor (likeRepository: LikeRepository, repostRepository: RepostRepository) {
    this.likeRepository = likeRepository
    this.repostRepository = repostRepository
  }

  async execute (userId: string, repostId: string): Promise<LikeResponse> {
    const repost = await this.repostRepository.findById(repostId)

    if (repost == null) {
      throw new RepostNotFoundError()
    }

    const existingLike = await this.likeRepository.findByUserAndRepost(userId, repostId)

    if (existingLike != null) {
      throw new LikeAlreadyExistsError()
    }

    const like = await this.likeRepository.createRepostLike(userId, repostId)

    return {
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      repostId: like.repostId,
      createdAt: like.createdAt.toISOString()
    }
  }
}
