import prisma from '@shared/infrastructure/prisma'
import { type MentionItem } from '../../domain/models/MentionItem'
import { type MentionRepository } from '../../domain/ports/MentionRepository'
import { DEFAULT_PAGE, DEFAULT_LIMIT, type BaseQueryParams, type ResultWithPagination, buildPaginatedResult } from '@shared/domain/types/query-filters'

function buildPagination (params?: BaseQueryParams): { skip: number, take: number } {
  const page = params?.page ?? DEFAULT_PAGE
  const limit = params?.limit ?? DEFAULT_LIMIT
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

interface MentionRow {
  id: string
  createdAt: Date
  author: { username: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }
  fact: { id: string, title: string | null, content: string } | null
  comment: { id: string, content: string, factId: string } | null
}

function mapMention (mention: MentionRow): MentionItem {
  const base = {
    id: mention.id,
    author: mention.author,
    createdAt: mention.createdAt
  }

  if (mention.fact !== null) {
    return {
      ...base,
      type: 'fact' as const,
      fact: {
        id: mention.fact.id,
        title: mention.fact.title,
        content: mention.fact.content
      }
    }
  }

  if (mention.comment !== null) {
    return {
      ...base,
      type: 'comment' as const,
      comment: {
        id: mention.comment.id,
        content: mention.comment.content,
        factId: mention.comment.factId
      }
    }
  }

  return {
    ...base,
    type: 'fact' as const
  }
}

export class PrismaMentionRepository implements MentionRepository {
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

  async findMentionsForUser (mentionedUserId: string, params?: BaseQueryParams): Promise<ResultWithPagination<MentionItem>> {
    const page = params?.page ?? DEFAULT_PAGE
    const limit = params?.limit ?? DEFAULT_LIMIT
    const { skip, take } = buildPagination(params)

    const [mentions, total] = await Promise.all([
      prisma.mention.findMany({
        where: { mentionedUserId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          fact: {
            select: { id: true, title: true, content: true }
          },
          comment: {
            select: { id: true, content: true, factId: true }
          },
          author: {
            select: { username: true, displayName: true, avatarUrl: true, avatarColor: true }
          }
        }
      }),
      prisma.mention.count({ where: { mentionedUserId } })
    ])

    return buildPaginatedResult(mentions.map(mapMention), total, page, limit)
  }
}
