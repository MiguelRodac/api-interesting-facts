import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type LikePreviewResponse } from '../dto/LikeResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetLikesByFact {
  private readonly likeRepository: LikeRepository

  constructor (likeRepository: LikeRepository) {
    this.likeRepository = likeRepository
  }

  async execute (factId: string, params?: BaseQueryParams): Promise<ResultWithPagination<LikePreviewResponse>> {
    const { results: likes, ...pagination } = await this.likeRepository.findByFactId(factId, params)

    return {
      results: likes.map(like => ({
        id: like.id,
        username: like.username,
        displayName: like.displayName,
        avatarUrl: like.avatarUrl,
        avatarColor: like.avatarColor,
        createdAt: like.createdAt.toISOString()
      })),
      ...pagination
    }
  }
}