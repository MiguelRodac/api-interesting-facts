import { type RepostRepository } from '../../domain/ports/RepostRepository'
import { type RepostPreviewResponse } from '../dto/RepostResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetRepostsByFact {
  private readonly repostRepository: RepostRepository

  constructor (repostRepository: RepostRepository) {
    this.repostRepository = repostRepository
  }

  async execute (originalFactId: string, params?: BaseQueryParams): Promise<ResultWithPagination<RepostPreviewResponse>> {
    const { results: reposts, ...pagination } = await this.repostRepository.findByFactId(originalFactId, params)

    return {
      results: reposts.map(repost => ({
        id: repost.id,
        username: repost.username,
        displayName: repost.displayName,
        avatarUrl: repost.avatarUrl,
        avatarColor: repost.avatarColor,
        createdAt: repost.createdAt.toISOString()
      })),
      ...pagination
    }
  }
}
