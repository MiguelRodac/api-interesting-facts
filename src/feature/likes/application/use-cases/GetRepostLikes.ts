import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type RepostRepository } from '../../../reposts/domain/ports/RepostRepository'
import { type LikePreviewResponse } from '../dto/LikeResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'
import { RepostNotFoundError } from '../../../reposts/domain/errors/RepostNotFoundError'

export class GetRepostLikes {
  private readonly likeRepository: LikeRepository
  private readonly repostRepository: RepostRepository

  constructor (likeRepository: LikeRepository, repostRepository: RepostRepository) {
    this.likeRepository = likeRepository
    this.repostRepository = repostRepository
  }

  async execute (repostId: string, params?: BaseQueryParams): Promise<ResultWithPagination<LikePreviewResponse>> {
    const repost = await this.repostRepository.findById(repostId)

    if (repost == null) {
      throw new RepostNotFoundError()
    }

    const { results: likes, ...pagination } = await this.likeRepository.findByRepostId(repostId, params)

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
