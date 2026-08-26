import { type LikeRepository } from '../../domain/ports/LikeRepository'
import { type FactRepository } from '../../../facts/domain/ports/FactRepository'
import { type RepostRepository } from '../../../reposts/domain/ports/RepostRepository'
import { type CommentRepository } from '../../../comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../../../facts/application/dto/FeedEntry'
import { type RepostResponse } from '../../../facts/application/dto/RepostResponse'
import { mapFactViewToResponse } from '../../../facts/application/mappers/factMapper'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetLikesByUser {
  private readonly likeRepository: LikeRepository
  private readonly factRepository: FactRepository
  private readonly repostRepository: RepostRepository
  private readonly commentRepository: CommentRepository

  constructor (likeRepository: LikeRepository, factRepository: FactRepository, repostRepository: RepostRepository, commentRepository: CommentRepository) {
    this.likeRepository = likeRepository
    this.factRepository = factRepository
    this.repostRepository = repostRepository
    this.commentRepository = commentRepository
  }

  async execute (userId: string, params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FeedEntry>> {
    const { results: likes, ...pagination } = await this.likeRepository.findByUserId(userId, params)

    // Separate fact likes from repost likes
    const factLikeMap = new Map<string, Date>()
    const repostLikeMap = new Map<string, Date>()
    for (const like of likes) {
      if (like.factId != null) factLikeMap.set(like.factId, like.createdAt)
      if (like.repostId != null) repostLikeMap.set(like.repostId, like.createdAt)
    }

    const factIds = [...factLikeMap.keys()]
    const repostIds = [...repostLikeMap.keys()]

    // Fetch enriched facts and reposts in parallel
    const [enrichedFacts, repostsWithFact] = await Promise.all([
      factIds.length > 0 ? this.factRepository.findByIds(factIds, viewerId) : [],
      repostIds.length > 0 ? this.repostRepository.findByIdsWithFact(repostIds) : []
    ])

    // Build fact entries
    const factEntries: FeedEntry[] = enrichedFacts.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: factLikeMap.get(fact.id)?.toISOString() ?? fact.createdAt.toISOString()
    }))

    // Build repost entries with full enrichment
    const repostEntries: FeedEntry[] = []
    if (repostsWithFact.length > 0) {
      const originalFactIds = repostsWithFact.map(r => r.originalFactId)
      const repostIdsForBatch = repostsWithFact.map(r => r.id)

      const [rawEmbedded, repostLikeCounts, repostCommentCounts, repostFirstComments, repostLikeByMap, viewerRepostLikedSet] = await Promise.all([
        this.factRepository.findRawByIds(originalFactIds),
        this.likeRepository.batchLikeCountsByRepostIds(repostIdsForBatch),
        this.commentRepository.batchCommentCountsByRepostIds(repostIdsForBatch),
        this.commentRepository.batchFirstCommentByRepostIds(repostIdsForBatch),
        this.likeRepository.batchRecentRepostLikers(repostIdsForBatch, 3),
        viewerId != null
          ? this.likeRepository.batchUserRepostLikes(repostIdsForBatch, viewerId)
          : null
      ])

      const enrichmentMaps = await this.factRepository.batchBuildEnrichmentMaps(originalFactIds)
      const enrichedEmbedded = await this.factRepository.batchEnrichFacts(rawEmbedded, enrichmentMaps, viewerId)
      const embeddedMap = new Map(enrichedEmbedded.map(f => [f.id, f]))

      for (const repost of repostsWithFact) {
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
          liked: viewerRepostLikedSet?.has(repost.id) ?? undefined,
          likeBy: repostLikeByMap.get(repost.id) ?? [],
          repostCommentCount: repostCommentCounts.get(repost.id) ?? 0,
          repostCommentsDetails: repostFirstComments.get(repost.id) ?? null,
          createdAt: repost.createdAt.toISOString()
        }

        repostEntries.push({
          type: 'repost',
          repost: repostResponse,
          createdAt: repostLikeMap.get(repost.id)?.toISOString() ?? repost.createdAt.toISOString()
        })
      }
    }

    // Merge and sort by like date descending
    const all = [...factEntries, ...repostEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return {
      results: all,
      ...pagination
    }
  }
}
