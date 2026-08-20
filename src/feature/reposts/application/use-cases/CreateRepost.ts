import { Prisma } from '@prisma/client'
import { type RepostRepository } from '../../domain/ports/RepostRepository'
import { type FactRepository } from '../../../facts/domain/ports/FactRepository'
import { type RepostResponse } from '../dto/RepostResponse'
import { FactNotFoundError } from '../../../facts/domain/errors/FactNotFoundError'
import { RepostSelfError } from '../../domain/errors/RepostSelfError'
import { RepostAlreadyExistsError } from '../../domain/errors/RepostAlreadyExistsError'

export class CreateRepost {
  private readonly repostRepository: RepostRepository
  private readonly factRepository: FactRepository

  constructor (repostRepository: RepostRepository, factRepository: FactRepository) {
    this.repostRepository = repostRepository
    this.factRepository = factRepository
  }

  async execute (userId: string, originalFactId: string): Promise<RepostResponse> {
    const fact = await this.factRepository.findById(originalFactId)

    if (fact == null) {
      throw new FactNotFoundError()
    }

    // Self-repost is forbidden — the invariant lives here (no cross-table DB CHECK).
    // Check order invariant: 404 (fact) → 400 (self) → 409 (duplicate).
    if (fact.authorId === userId) {
      throw new RepostSelfError()
    }

    let repost
    try {
      repost = await this.repostRepository.create(userId, originalFactId)
    } catch (err) {
      // Concurrent duplicate race: both POSTs pass the pre-check, the second hits @@unique.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new RepostAlreadyExistsError()
      }
      throw err
    }

    return {
      id: repost.id,
      userId: repost.authorId,
      factId: repost.originalFactId,
      createdAt: repost.createdAt.toISOString()
    }
  }
}
