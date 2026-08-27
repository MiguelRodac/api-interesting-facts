import prisma from '@shared/infrastructure/prisma'
import { type FactRepository } from '@fact/domain/ports/FactRepository'
import { type LikeRepository } from '@likes/domain/ports/LikeRepository'
import { type CommentRepository } from '@comments/domain/ports/CommentRepository'

import { type FeedEntry } from '@fact/application/dto/FeedEntry'
import { type RepostResponse } from '@fact/application/dto/RepostResponse'
import { mapFactViewToResponse } from '@fact/application/mappers/factMapper'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'

export class GetMentionsByUser {
  private readonly factRepository: FactRepository
  private readonly likeRepository: LikeRepository
  private readonly commentRepository: CommentRepository

  constructor (
    factRepository: FactRepository,
    likeRepository: LikeRepository,
    commentRepository: CommentRepository
  ) {
    this.factRepository = factRepository
    this.likeRepository = likeRepository
    this.commentRepository = commentRepository
  }

  async execute (
    userId: string,
    username: string,
    params?: BaseQueryParams,
    viewerId?: string
  ): Promise<ResultWithPagination<FeedEntry>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT

    // 1. Query all mentions for this user (relational mentions + text search)
    const [mentions, textFacts, textComments] = await Promise.all([
      prisma.mention.findMany({
        where: { mentionedUserId: userId },
        include: {
          comment: { select: { factId: true, repostId: true } }
        }
      }),
      prisma.fact.findMany({
        where: { content: { contains: `@${username}`, mode: 'insensitive' } },
        select: { id: true }
      }),
      prisma.comment.findMany({
        where: { content: { contains: `@${username}`, mode: 'insensitive' } },
        select: { factId: true, repostId: true }
      })
    ])

    const factIds = new Set<string>()
    const repostIds = new Set<string>()

    for (const m of mentions) {
      if (m.factId != null) factIds.add(m.factId)
      if (m.comment?.factId != null) factIds.add(m.comment.factId)
      if (m.comment?.repostId != null) repostIds.add(m.comment.repostId)
    }

    for (const tf of textFacts) {
      factIds.add(tf.id)
    }

    for (const tc of textComments) {
      if (tc.factId != null) factIds.add(tc.factId)
      if (tc.repostId != null) repostIds.add(tc.repostId)
    }

    if (factIds.size === 0 && repostIds.size === 0) {
      return buildPaginatedResult([], 0, page, limit)
    }

    // 2. Fetch and enrich Facts
    const factList = factIds.size > 0
      ? await this.factRepository.findByIds(Array.from(factIds), viewerId)
      : []

    const factEntries: FeedEntry[] = factList.map(fact => ({
      type: 'fact',
      fact: mapFactViewToResponse(fact),
      createdAt: fact.createdAt.toISOString()
    }))

    // 3. Fetch and enrich Reposts
    const repostEntries: FeedEntry[] = []
    if (repostIds.size > 0) {
      const repostIdArr = Array.from(repostIds)
      const reposts = await prisma.repost.findMany({
        where: { id: { in: repostIdArr } },
        include: {
          author: {
            select: { username: true, displayName: true, avatarUrl: true, avatarColor: true }
          }
        }
      })

      const originalFactIds = [...new Set(reposts.map(r => r.originalFactId))]
      const [rawEmbedded, repostLikeCounts, repostCommentCounts, repostFirstComments, repostLikeByMap, viewerRepostLikedSet] = await Promise.all([
        this.factRepository.findRawByIds(originalFactIds),
        this.likeRepository.batchLikeCountsByRepostIds(repostIdArr),
        this.commentRepository.batchCommentCountsByRepostIds(repostIdArr),
        this.commentRepository.batchFirstCommentByRepostIds(repostIdArr),
        this.likeRepository.batchRecentRepostLikers(repostIdArr, 3),
        viewerId != null
          ? this.likeRepository.batchUserRepostLikes(repostIdArr, viewerId)
          : null
      ])

      const enrichmentMaps = await this.factRepository.batchBuildEnrichmentMaps(originalFactIds)
      const enrichedEmbedded = await this.factRepository.batchEnrichFacts(rawEmbedded, enrichmentMaps, viewerId)
      const embeddedMap = new Map(enrichedEmbedded.map(f => [f.id, f]))

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
            username: repost.author.username,
            displayName: repost.author.displayName,
            avatarUrl: repost.author.avatarUrl,
            avatarColor: repost.author.avatarColor,
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
    }

    // 4. Combine, sort descending by createdAt, and paginate
    const all = [...factEntries, ...repostEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const total = all.length
    const skip = (page - 1) * limit
    const paged = all.slice(skip, skip + limit)

    return buildPaginatedResult(paged, total, page, limit)
  }
}
