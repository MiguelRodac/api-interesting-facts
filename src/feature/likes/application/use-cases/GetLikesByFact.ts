import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type LikeResponse } from '../dto/LikeResponse'
import { type BaseQueryParams, type ResultWithPagination } from '../../../../shared/domain/types/query-filters'

export class GetLikesByFact {
  private readonly likeRepository: LikeRepository

  constructor (likeRepository: LikeRepository) {
    this.likeRepository = likeRepository
  }

  async execute (factId: string, params?: BaseQueryParams): Promise<ResultWithPagination<LikeResponse>> {
    const { items: likes, total } = await this.likeRepository.findByFactId(factId, params)
    const page = params?.page ?? 1
    const limit = params?.limit ?? 10
    const nextPage = page * limit < total ? page + 1 : null

    return {
      results: likes.map(like => ({
        id: like.id,
        userId: like.userId,
        factId: like.factId,
        createdAt: like.createdAt.toISOString()
      })),
      page,
      limit,
      nextPage
    }
  }
}
