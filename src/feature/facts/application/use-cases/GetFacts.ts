import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { type RepostResponse } from '../dto/RepostResponse'
import { mapFactViewToResponse } from '../mappers/factMapper'
import { DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetFacts {
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

  async execute (params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FeedEntry>> {
    const limit = params?.limit ?? DEFAULT_LIMIT
    const page = params?.page ?? 1

    // ── Phase 1: Fetch all raw data in parallel ─────────────────────────────
    const [rawFactsPage, repostsPage] = await Promise.all([
      this.factRepository.findRawAll(params),
      this.repostRepository.findAllWithFact(params)
    ])

    const { facts: rawFacts } = rawFactsPage

    // ── Phase 2: Fetch embedded facts for reposts ───────────────────────────
    const originalFactIds = repostsPage.results.map(r => r.originalFactId)
    const rawEmbedded = await this.factRepository.findRawByIds(originalFactIds)

    // ── Phase 3: Build enrichment maps for ALL facts at once ────────────────
    const allFactIds = [
      ...rawFacts.map(f => f.id),
      ...rawEmbedded.map(f => f.id)
    ]
    const enrichmentMaps = await this.factRepository.batchBuildEnrichmentMaps(allFactIds)

    // ── Phase 4: Fetch repost engagement (likes/comments on the repost itself)
    const repostIds = repostsPage.results.map(r => r.id)
    const [repostLikeCounts, repostCommentCounts, repostFirstComments] = await Promise.all([
      this.likeRepository.batchLikeCountsByRepostIds(repostIds),
      this.commentRepository.batchCommentCountsByRepostIds(repostIds),
      this.commentRepository.batchFirstCommentByRepostIds(repostIds)
    ])

    // ── Phase 5: Enrich all facts in memory (no DB calls) ───────────────────
    const enrichedFacts = await this.factRepository.batchEnrichFacts(rawFacts, enrichmentMaps, viewerId)
    const enrichedEmbedded = await this.factRepository.batchEnrichFacts(rawEmbedded, enrichmentMaps, viewerId)

    // ── Phase 6: Assemble feed entries ──────────────────────────────────────
    const embeddedMap = new Map(enrichedEmbedded.map(f => [f.id, f]))

    const factEntries: FeedEntry[] = enrichedFacts.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: fact.createdAt.toISOString()
    }))

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
