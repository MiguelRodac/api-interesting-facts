import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { type RepostResponse } from '../dto/RepostResponse'
import { mapFactViewToResponse } from '../mappers/factMapper'

export interface PaginationEntry {
  id: string
  type: string
  originalFactId: string
  authorId: string
  createdAt: Date | string
}

export class FeedHydrator {
  constructor (
    private readonly factRepository: FactRepository,
    private readonly repostRepository: RepostRepository,
    private readonly likeRepository: LikeRepository,
    private readonly commentRepository: CommentRepository
  ) {}

  async hydrate (entries: PaginationEntry[], viewerId?: string): Promise<FeedEntry[]> {
    if (entries.length === 0) return []

    // 1. Collect unique fact IDs and repost IDs
    const factIdsSet = new Set<string>()
    const repostIds: string[] = []

    for (const entry of entries) {
      factIdsSet.add(entry.originalFactId)
      if (entry.type === 'repost') {
        repostIds.push(entry.id)
      }
    }

    const uniqueFactIds = Array.from(factIdsSet)

    // 2. Fetch raw facts & build enrichment maps in parallel with repost engagement data
    const [
      rawFacts,
      enrichmentMaps,
      reposts,
      repostLikeCounts,
      repostCommentCounts,
      repostFirstComments,
      repostLikeByMap,
      viewerRepostLikedSet
    ] = await Promise.all([
      this.factRepository.findRawByIds(uniqueFactIds),
      this.factRepository.batchBuildEnrichmentMaps(uniqueFactIds),
      repostIds.length > 0 ? this.repostRepository.findByIdsWithFact(repostIds) : Promise.resolve([]),
      repostIds.length > 0 ? this.likeRepository.batchLikeCountsByRepostIds(repostIds) : Promise.resolve(new Map<string, number>()),
      repostIds.length > 0 ? this.commentRepository.batchCommentCountsByRepostIds(repostIds) : Promise.resolve(new Map<string, number>()),
      repostIds.length > 0 ? this.commentRepository.batchFirstCommentByRepostIds(repostIds) : Promise.resolve(new Map()),
      repostIds.length > 0 ? this.likeRepository.batchRecentRepostLikers(repostIds, 3) : Promise.resolve(new Map()),
      (repostIds.length > 0 && viewerId != null)
        ? this.likeRepository.batchUserRepostLikes(repostIds, viewerId)
        : Promise.resolve(null)
    ])

    // 3. Enrich facts in memory
    const enrichedFacts = await this.factRepository.batchEnrichFacts(rawFacts, enrichmentMaps, viewerId)
    const factMap = new Map(enrichedFacts.map(f => [f.id, f]))
    const repostMap = new Map(reposts.map(r => [r.id, r]))

    // 4. Assemble FeedEntry[] preserving original database order
    const feedEntries: FeedEntry[] = []

    for (const entry of entries) {
      const createdAtIso = entry.createdAt instanceof Date ? entry.createdAt.toISOString() : new Date(entry.createdAt).toISOString()

      if (entry.type === 'fact') {
        const fact = factMap.get(entry.originalFactId)
        if (fact == null) continue

        feedEntries.push({
          type: 'fact',
          fact: mapFactViewToResponse(fact),
          createdAt: createdAtIso
        })
      } else if (entry.type === 'repost') {
        const originalFact = factMap.get(entry.originalFactId)
        const repost = repostMap.get(entry.id)
        if (originalFact == null || repost == null) continue

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
          createdAt: createdAtIso
        }

        feedEntries.push({
          type: 'repost',
          repost: repostResponse,
          createdAt: createdAtIso
        })
      }
    }

    return feedEntries
  }
}
