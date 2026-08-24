import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { type RepostResponse } from '../dto/RepostResponse'
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

    const [rawEmbedded, repostLikeCounts, repostCommentCounts, repostFirstComments] = await Promise.all([
      this.factRepository.findRawByIds(originalFactIds),
      this.likeRepository.batchLikeCountsByRepostIds(repostIds),
      this.commentRepository.batchCommentCountsByRepostIds(repostIds),
      this.commentRepository.batchFirstCommentByRepostIds(repostIds)
    ])

    const enrichedEmbedded = await this.factRepository.batchEnrichFacts(rawEmbedded, await this.factRepository.batchBuildEnrichmentMaps(originalFactIds), viewerId)
    const embeddedMap = new Map(enrichedEmbedded.map(f => [f.id, f]))

    const repostEntries: FeedEntry[] = []
    for (const repost of repostsPage.results) {
      const originalFact = embeddedMap.get(repost.originalFactId)
      if (originalFact === undefined) continue

      const repostResponse: RepostResponse = {
        id: repost.id,
        factId: repost.originalFactId,
        author: originalFact.author,
        title: originalFact.title,
        content: originalFact.content,
        hashtags: originalFact.hashtags,
        repostCount: originalFact.repostCount,
        repostedBy: {
          username: repost.username,
          displayName: repost.displayName,
          avatarUrl: repost.avatarUrl,
          avatarColor: repost.avatarColor,
          isMe: repost.authorId === viewerId
        },
        repostLikeCount: repostLikeCounts.get(repost.id) ?? 0,
        repostCommentCount: repostCommentCounts.get(repost.id) ?? 0,
        repostCommentsDetails: repostFirstComments.get(repost.id) ?? null,
        createdAt: repost.createdAt.toISOString()
      }

      repostEntries.push({
        type: 'repost',
        repost: repostResponse,
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
