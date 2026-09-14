import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { FeedHydrator } from '../services/FeedHydrator'
import { DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import {
  type CursorQueryParams,
  type ResultWithCursor,
  decodeCursor,
  encodeCursor
} from '@shared/domain/types/cursor-pagination'

export class GetFactsByAuthor {
  private readonly factRepository: FactRepository
  private readonly hydrator: FeedHydrator

  constructor (factRepository: FactRepository, repostRepository: RepostRepository, likeRepository: LikeRepository, commentRepository: CommentRepository) {
    this.factRepository = factRepository
    this.hydrator = new FeedHydrator(factRepository, repostRepository, likeRepository, commentRepository)
  }

  async execute (authorId: string, params?: CursorQueryParams, viewerId?: string): Promise<ResultWithCursor<FeedEntry>> {
    const limit = params?.limit ?? DEFAULT_LIMIT
    const cursor = decodeCursor(params?.cursor)
    const take = limit + 1

    const entries = await this.factRepository.findAuthorFeedPagination(authorId, { cursor, take })
    const hasMore = entries.length > limit
    const pageEntries = entries.slice(0, limit)
    const results = await this.hydrator.hydrate(pageEntries, viewerId)

    const lastEntry = pageEntries.length > 0 ? pageEntries[pageEntries.length - 1] : null
    const nextCursor = hasMore && lastEntry != null
      ? encodeCursor({ createdAt: lastEntry.createdAt, id: lastEntry.id })
      : null

    return {
      results,
      limit,
      nextCursor,
      hasMore
    }
  }
}
