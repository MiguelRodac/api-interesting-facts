import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type FactRepository } from '../../../facts/domain/ports/FactRepository'
import { type LikeResponse } from '../dto/LikeResponse'
import { FactNotFoundError } from '../../../../shared/domain/errors/FactNotFoundError'
import { LikeAlreadyExistsError } from '../../../../shared/domain/errors/LikeAlreadyExistsError'

export class CreateLike {
  private readonly likeRepository: LikeRepository
  private readonly factRepository: FactRepository

  constructor (likeRepository: LikeRepository, factRepository: FactRepository) {
    this.likeRepository = likeRepository
    this.factRepository = factRepository
  }

  async execute (userId: string, factId: string): Promise<LikeResponse> {
    const fact = await this.factRepository.findById(factId)

    if (fact == null) {
      throw new FactNotFoundError()
    }

    const existingLike = await this.likeRepository.findByUserAndFact(userId, factId)

    if (existingLike != null) {
      throw new LikeAlreadyExistsError()
    }

    const like = await this.likeRepository.create(userId, factId)

    return {
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      createdAt: like.createdAt.toISOString()
    }
  }
}
