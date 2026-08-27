import prisma from '@shared/infrastructure/prisma'
import { type MentionItem } from '../../domain/models/MentionItem'
import { type MentionRepository } from '../../domain/ports/MentionRepository'
import { type FactRepository } from '@fact/domain/ports/FactRepository'
import { PrismaFactRepository } from '@fact/infrastructure/repositories/PrismaFactRepository'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'

function buildPagination (params?: BaseQueryParams): { skip: number, take: number } {
  const page = params?.page ?? DEFAULT_PAGE
  const limit = params?.limit ?? DEFAULT_LIMIT
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

export class PrismaMentionRepository implements MentionRepository {
  private readonly factRepository: FactRepository

  constructor (factRepository?: FactRepository) {
    this.factRepository = factRepository ?? new PrismaFactRepository()
  }

  async replaceFactMentions (factId: string, authorId: string, mentionedUserIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(mentionedUserIds)]

    await prisma.$transaction(async (tx) => {
      await tx.mention.deleteMany({ where: { factId } })
      if (uniqueIds.length > 0) {
        await tx.mention.createMany({
          data: uniqueIds.map(mentionedUserId => ({ factId, authorId, mentionedUserId }))
        })
      }
    })
  }

  async replaceCommentMentions (commentId: string, authorId: string, mentionedUserIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(mentionedUserIds)]

    await prisma.$transaction(async (tx) => {
      await tx.mention.deleteMany({ where: { commentId } })
      if (uniqueIds.length > 0) {
        await tx.mention.createMany({
          data: uniqueIds.map(mentionedUserId => ({ commentId, authorId, mentionedUserId }))
        })
      }
    })
  }

  async findMentionsForUser (mentionedUserId: string, params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<MentionItem>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)

    const [rawMentions, total] = await Promise.all([
      prisma.mention.findMany({
        where: { mentionedUserId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          fact: {
            select: { id: true }
          },
          comment: {
            select: {
              id: true,
              content: true,
              factId: true,
              repostId: true,
              createdAt: true,
              author: {
                select: { firebaseUid: true, username: true, displayName: true, avatarUrl: true, avatarColor: true }
              },
              repost: {
                select: { originalFactId: true }
              }
            }
          },
          author: {
            select: { firebaseUid: true, username: true, displayName: true, avatarUrl: true, avatarColor: true }
          }
        }
      }),
      prisma.mention.count({ where: { mentionedUserId } })
    ])

    if (rawMentions.length === 0) {
      return buildPaginatedResult([], total, page, limit)
    }

    // Collect all relevant fact IDs to enrich
    const factIdsToFetch = new Set<string>()
    for (const m of rawMentions) {
      if (m.factId != null) {
        factIdsToFetch.add(m.factId)
      } else if (m.comment != null) {
        if (m.comment.factId != null) {
          factIdsToFetch.add(m.comment.factId)
        } else if (m.comment.repost?.originalFactId != null) {
          factIdsToFetch.add(m.comment.repost.originalFactId)
        }
      }
    }

    const enrichedFacts = factIdsToFetch.size > 0
      ? await this.factRepository.findByIds(Array.from(factIdsToFetch), viewerId)
      : []
    const factMap = new Map(enrichedFacts.map(f => [f.id, f]))

    const mapped: MentionItem[] = rawMentions.map(m => {
      const author = {
        id: m.author.firebaseUid,
        username: m.author.username,
        displayName: m.author.displayName,
        avatarUrl: m.author.avatarUrl,
        avatarColor: m.author.avatarColor
      }

      if (m.comment != null) {
        const targetFactId = m.comment.factId ?? m.comment.repost?.originalFactId ?? null
        const rawFact = targetFactId != null ? factMap.get(targetFactId) : undefined
        const fact = rawFact !== undefined
          ? {
              ...rawFact,
              commentsDetails: {
                id: m.comment.id,
                content: m.comment.content,
                author: {
                  username: m.comment.author.username,
                  avatarUrl: m.comment.author.avatarUrl,
                  avatarColor: m.comment.author.avatarColor
                },
                parentCommentId: null,
                replies: 0,
                createdAt: m.comment.createdAt.toISOString()
              }
            }
          : undefined

        return {
          id: m.id,
          type: 'comment' as const,
          author,
          createdAt: m.createdAt,
          fact,
          comment: {
            id: m.comment.id,
            content: m.comment.content,
            factId: m.comment.factId,
            repostId: m.comment.repostId,
            author: {
              id: m.comment.author.firebaseUid,
              username: m.comment.author.username,
              displayName: m.comment.author.displayName,
              avatarUrl: m.comment.author.avatarUrl,
              avatarColor: m.comment.author.avatarColor
            },
            createdAt: m.comment.createdAt
          }
        }
      }

      const fact = m.factId != null ? factMap.get(m.factId) : undefined
      return {
        id: m.id,
        type: 'fact' as const,
        author,
        createdAt: m.createdAt,
        fact
      }
    })

    return buildPaginatedResult(mapped, total, page, limit)
  }
}
