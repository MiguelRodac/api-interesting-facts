import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { FeedHydrator } from '../services/FeedHydrator'
import { DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetFactsByAuthor {
  private readonly factRepository: FactRepository
  private readonly hydrator: FeedHydrator

  constructor (factRepository: FactRepository, repostRepository: RepostRepository, likeRepository: LikeRepository, commentRepository: CommentRepository) {
    this.factRepository = factRepository
    this.hydrator = new FeedHydrator(factRepository, repostRepository, likeRepository, commentRepository)
  }

  async execute (authorId: string, params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FeedEntry>> {
    const limit = params?.limit ?? DEFAULT_LIMIT
    const page = params?.page ?? 1
    const skip = (page - 1) * limit
    const take = limit + 1

    const entries = await this.factRepository.findAuthorFeedPagination(authorId, { skip, take })
    const hasMore = entries.length > limit
    const pageEntries = entries.slice(0, limit)
    const results = await this.hydrator.hydrate(pageEntries, viewerId)

    return {
      results,
      page,
      limit,
      nextPage: hasMore ? page + 1 : null
    }
  }
}
