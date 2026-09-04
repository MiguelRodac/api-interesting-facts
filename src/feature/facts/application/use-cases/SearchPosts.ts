import { type FactRepository } from '../../domain/ports/FactRepository'
import { type RepostRepository } from '@reposts/domain/ports/RepostRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'
import { type FeedEntry } from '../dto/FeedEntry'
import { type RepostResponse } from '../dto/RepostResponse'
import { mapFactViewToResponse } from '../mappers/factMapper'
import { type SearchOrderParams } from '@shared/domain/types/query-filters'
import { type RepostWithFact } from '@reposts/domain/models/RepostWithFact'

export class SearchPosts {
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

  private async enrichReposts (reposts: RepostWithFact[], viewerId?: string): Promise<FeedEntry[]> {
    if (reposts.length === 0) return []

    const originalFactIds = reposts.map(r => r.originalFactId)
    const repostIds = reposts.map(r => r.id)

    const [rawEmbedded, repostLikeCounts, repostCommentCounts, repostFirstComments, repostLikeByMap, viewerRepostLikedSet] = await Promise.all([
      this.factRepository.findRawByIds(originalFactIds),
      this.likeRepository.batchLikeCountsByRepostIds(repostIds),
      this.commentRepository.batchCommentCountsByRepostIds(repostIds),
      this.commentRepository.batchFirstCommentByRepostIds(repostIds),
      this.likeRepository.batchRecentRepostLikers(repostIds, 3),
      viewerId != null
        ? this.likeRepository.batchUserRepostLikes(repostIds, viewerId)
        : null
    ])

    const enrichmentMaps = await this.factRepository.batchBuildEnrichmentMaps(originalFactIds)
    const enrichedEmbedded = await this.factRepository.batchEnrichFacts(rawEmbedded, enrichmentMaps, viewerId)
    const embeddedMap = new Map(enrichedEmbedded.map(f => [f.id, f]))

    const repostEntries: FeedEntry[] = []
    for (const repost of reposts) {
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
        createdAt: repost.createdAt.toISOString()
      })
    }

    return repostEntries
  }

  async execute (query: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<FeedEntry[]> {
    const limit = orderParams?.limit ?? 10
    const { results: facts } = await this.factRepository.findByTitleOrHashtag(query, { page: 1, limit }, viewerId, orderParams)

    const factEntries: FeedEntry[] = facts.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: fact.createdAt.toISOString()
    }))

    const factIds = facts.map(f => f.id)
    if (factIds.length === 0) return factEntries

    const { results: reposts } = await this.repostRepository.findByFactIdsWithFact(factIds, { page: 1, limit })
    const repostEntries = await this.enrichReposts(reposts, viewerId)

    return [...factEntries, ...repostEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async executeByAuthorOrMention (query: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<FeedEntry[]> {
    const limit = orderParams?.limit ?? 10
    const { results: facts } = await this.factRepository.findByAuthorOrMention(query, { page: 1, limit }, viewerId, orderParams)

    const factEntries: FeedEntry[] = facts.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: fact.createdAt.toISOString()
    }))

    // Collect unique author IDs from matched facts to fetch their reposts
    const authorIds = [...new Set(facts.map(f => f.authorId))]
    if (authorIds.length === 0) return factEntries

    const { results: reposts } = await this.repostRepository.findByAuthorsWithFact(authorIds, { page: 1, limit })
    const repostEntries = await this.enrichReposts(reposts, viewerId)

    return [...factEntries, ...repostEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async executeByHashtag (tag: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<FeedEntry[]> {
    const limit = orderParams?.limit ?? 10
    const { results: facts } = await this.factRepository.findByHashtag(tag, { page: 1, limit }, viewerId, orderParams)

    const factEntries: FeedEntry[] = facts.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: fact.createdAt.toISOString()
    }))

    const factIds = facts.map(f => f.id)
    if (factIds.length === 0) return factEntries

    const { results: reposts } = await this.repostRepository.findByFactIdsWithFact(factIds, { page: 1, limit })
    const repostEntries = await this.enrichReposts(reposts, viewerId)

    return [...factEntries, ...repostEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}
