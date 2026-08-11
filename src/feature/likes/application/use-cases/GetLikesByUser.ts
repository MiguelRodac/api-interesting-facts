import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type LikeResponse } from '../dto/LikeResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetLikesByUser {
  private readonly likeRepository: LikeRepository

  constructor (likeRepository: LikeRepository) {
    this.likeRepository = likeRepository
  }

  async execute (userId: string, params?: BaseQueryParams): Promise<ResultWithPagination<LikeResponse>> {
    const { results: likes, ...pagination } = await this.likeRepository.findByUserId(userId, params)

    return {
      results: likes.map(like => ({
        id: like.id,
        userId: like.userId,
        factId: like.factId,
        createdAt: like.createdAt.toISOString()
      })),
      ...pagination
    }
  }
}
