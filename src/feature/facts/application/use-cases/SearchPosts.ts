import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { FeedHydrator } from '../services/FeedHydrator'
import { type SearchOrderParams } from '@shared/domain/types/query-filters'

export interface SearchPostsResult {
  results: FeedEntry[]
  hasMore: boolean
}

export class SearchPosts {
  private readonly factRepository: FactRepository
  private readonly hydrator: FeedHydrator

  constructor (factRepository: FactRepository, repostRepository: RepostRepository, likeRepository: LikeRepository, commentRepository: CommentRepository) {
    this.factRepository = factRepository
    this.hydrator = new FeedHydrator(factRepository, repostRepository, likeRepository, commentRepository)
  }

  async execute (query: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<SearchPostsResult> {
    const limit = orderParams?.limit ?? 10
    const page = orderParams?.page ?? 1
    const skip = orderParams?.skip ?? (page - 1) * limit
    const take = limit + 1

    const factIds = await this.factRepository.findFactIdsByQuery(query)
    if (factIds.length === 0) {
      return { results: [], hasMore: false }
    }

    const entries = await this.factRepository.findFeedPaginationByFactIds(factIds, { skip, take })
    const hasMore = entries.length > limit
    const pageEntries = entries.slice(0, limit)
    const results = await this.hydrator.hydrate(pageEntries, viewerId)

    return {
      results,
      hasMore
    }
  }

  async executeByAuthorOrMention (query: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<SearchPostsResult> {
    const limit = orderParams?.limit ?? 10
    const page = orderParams?.page ?? 1
    const skip = orderParams?.skip ?? (page - 1) * limit
    const take = limit + 1

    const { authorIds, factIds } = await this.factRepository.findMentionSearchTargets(query)
    if (authorIds.length === 0 && factIds.length === 0) {
      return { results: [], hasMore: false }
    }

    const entries = await this.factRepository.findFeedPaginationByAuthorsOrFactIds(authorIds, factIds, { skip, take })
    const hasMore = entries.length > limit
    const pageEntries = entries.slice(0, limit)
    const results = await this.hydrator.hydrate(pageEntries, viewerId)

    return {
      results,
      hasMore
    }
  }

  async executeByHashtag (tag: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<SearchPostsResult> {
    const limit = orderParams?.limit ?? 10
    const page = orderParams?.page ?? 1
    const skip = orderParams?.skip ?? (page - 1) * limit
    const take = limit + 1

    const factIds = await this.factRepository.findFactIdsByHashtag(tag)
    if (factIds.length === 0) {
      return { results: [], hasMore: false }
    }

    const entries = await this.factRepository.findFeedPaginationByFactIds(factIds, { skip, take })
    const hasMore = entries.length > limit
    const pageEntries = entries.slice(0, limit)
    const results = await this.hydrator.hydrate(pageEntries, viewerId)

    return {
      results,
      hasMore
    }
  }
}
