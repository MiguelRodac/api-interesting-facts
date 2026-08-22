import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { mapFactViewToResponse } from '../mappers/factMapper'
import { DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetFactsByAuthor {
  private readonly factRepository: FactRepository
  private readonly repostRepository: RepostRepository
  private readonly likeRepository: LikeRepository
  private readonly commentRepository: CommentRepository

  constructor (factRepository: FactRepository, repostRepository: RepostRepository, likeRepository: LikeRepository, commentRepository: CommentRepository) {
    this.factRepository = factRepository
    this.repostRepository = repostRepository
    this.likeRepository = likeRepository
    this.commentRepository = commentRepository
  }

  async execute (authorId: string, params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FeedEntry>> {
    const limit = params?.limit ?? DEFAULT_LIMIT
    const page = params?.page ?? 1

    const [factsPage, repostsPage] = await Promise.all([
      this.factRepository.findByAuthorId(authorId, params, viewerId),
      this.repostRepository.findByAuthorWithFact(authorId, params)
    ])

    const factEntries: FeedEntry[] = factsPage.results.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: fact.createdAt.toISOString()
    }))

    const originalFactIds = repostsPage.results.map(r => r.originalFactId)
    const repostIds = repostsPage.results.map(r => r.id)
    const [embedded, repostLikeCounts, repostCommentCounts] = await Promise.all([
      this.factRepository.findByIds(originalFactIds, viewerId),
      this.likeRepository.batchLikeCountsByRepostIds(repostIds),
      this.commentRepository.batchCommentCountsByRepostIds(repostIds)
    ])
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
        createdAt: repost.createdAt.toISOString(),
        repostLikeCount: repostLikeCounts.get(repost.id) ?? 0,
        repostCommentCount: repostCommentCounts.get(repost.id) ?? 0
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
