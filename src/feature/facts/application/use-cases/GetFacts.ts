import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { mapFactViewToResponse } from '../mappers/factMapper'
import { DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetFacts {
  private readonly factRepository: FactRepository
  private readonly repostRepository: RepostRepository

  constructor (factRepository: FactRepository, repostRepository: RepostRepository) {
    this.factRepository = factRepository
    this.repostRepository = repostRepository
  }

  async execute (params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FeedEntry>> {
    const limit = params?.limit ?? DEFAULT_LIMIT
    const page = params?.page ?? 1

    const [factsPage, repostsPage] = await Promise.all([
      this.factRepository.findAll(params, viewerId),
      this.repostRepository.findAllWithFact(params)
    ])

    const factEntries: FeedEntry[] = factsPage.results.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: fact.createdAt.toISOString()
    }))

    const originalFactIds = repostsPage.results.map(r => r.originalFactId)
    const embedded = await this.factRepository.findByIds(originalFactIds, viewerId)
    const embeddedMap = new Map(embedded.map(f => [f.id, mapFactViewToResponse(f)]))

    const repostEntries: FeedEntry[] = []
    for (const repost of repostsPage.results) {
      const fact = embeddedMap.get(repost.originalFactId)
      if (fact === undefined) continue
      repostEntries.push({
        type: 'repost',
        fact,
        repostedBy: {
          username: repost.username,
          displayName: repost.displayName,
          avatarUrl: repost.avatarUrl,
          avatarColor: repost.avatarColor,
          isMe: repost.authorId === viewerId
        },
        createdAt: repost.createdAt.toISOString()
      })
    }

    const all = [...factEntries, ...repostEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return {
      results: all.slice(0, limit),
      page,
      limit,
      nextPage: all.length > limit ? page + 1 : null
    }
  }
}
