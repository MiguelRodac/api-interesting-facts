import prisma from '@shared/infrastructure/prisma'
import { type Hashtag } from '../../domain/models/Hashtag'
import { type HashtagResponse } from '../../application/dto/HashtagResponse'
import { type HashtagWithUsage } from '../../application/dto/HashtagWithUsage'
import { buildPaginatedResult, type ResultWithPagination, type SearchOrderParams } from '@shared/domain/types/query-filters'

export class PrismaHashtagRepository {
  async upsertByTag (tag: string): Promise<Hashtag> {
    const normalizedTag = tag.toLowerCase()

    const hashtag = await prisma.hashtag.upsert({
      where: { tag: normalizedTag },
      update: {},
      create: { tag: normalizedTag }
    })

    return {
      id: hashtag.id,
      tag: hashtag.tag,
      createdAt: hashtag.createdAt
    }
  }

  async findByFactId (factId: string): Promise<HashtagResponse[]> {
    const factHashtags = await prisma.factHashtag.findMany({
      where: { factId },
      include: {
        hashtag: {
          select: { id: true, tag: true }
        }
      },
      orderBy: { hashtag: { tag: 'asc' } }
    })

    return factHashtags.map(fh => ({
      id: fh.hashtag.id,
      tag: fh.hashtag.tag
    }))
  }

  async replaceFactHashtags (factId: string, tagNames: string[]): Promise<HashtagResponse[]> {
    return await prisma.$transaction(async (tx) => {
      // Delete existing junction records
      await tx.factHashtag.deleteMany({
        where: { factId }
      })

      // Upsert each tag and create junction records
      const results: HashtagResponse[] = []

      for (const tagName of tagNames) {
        const normalizedTag = tagName.toLowerCase()

        const hashtag = await tx.hashtag.upsert({
          where: { tag: normalizedTag },
          update: {},
          create: { tag: normalizedTag }
        })

        await tx.factHashtag.create({
          data: {
            factId,
            hashtagId: hashtag.id
          }
        })

        results.push({ id: hashtag.id, tag: hashtag.tag })
      }

      return results
    })
  }

  async findByTagUsed (query: string, orderParams?: SearchOrderParams): Promise<ResultWithPagination<HashtagResponse>> {
    const normalizedQuery = query.toLowerCase()
    const orderBy = orderParams?.order_by ?? 'popular'
    const dir = orderParams?.order_dir === 'asc' ? 'asc' : 'desc'
    const limit = orderParams?.limit ?? 10
    const page = orderParams?.page ?? (orderParams?.skip != null && limit > 0 ? Math.floor(orderParams.skip / limit) + 1 : 1)
    const skip = orderParams?.skip ?? (page - 1) * limit

    const where = {
      tag: { contains: normalizedQuery },
      factHashtags: { some: {} }
    }

    const [hashtags, total] = await Promise.all([
      prisma.hashtag.findMany({
        where,
        orderBy: orderBy === 'recent'
          ? { createdAt: dir }
          : { factHashtags: { _count: dir } },
        skip,
        take: limit
      }),
      prisma.hashtag.count({ where })
    ])

    const mapped = hashtags.map(h => ({ id: h.id, tag: h.tag }))
    return buildPaginatedResult(mapped, total, page, limit)
  }

  async findPopular (query?: string, page: number = 1, limit: number = 10): Promise<{ results: HashtagWithUsage[], hasMore: boolean }> {
    const normalized = query?.trim().toLowerCase()
    const cleanTag = normalized?.startsWith('#') === true ? normalized.slice(1) : normalized

    const where = (cleanTag != null && cleanTag.length > 0)
      ? {
          tag: { contains: cleanTag },
          factHashtags: { some: {} }
        }
      : {
          factHashtags: { some: {} }
        }

    const skip = (page - 1) * limit
    const fetchLimit = limit + 1

    const hashtags = await prisma.hashtag.findMany({
      where,
      include: {
        _count: {
          select: { factHashtags: true }
        }
      },
      orderBy: {
        factHashtags: { _count: 'desc' }
      },
      skip,
      take: fetchLimit
    })

    const hasMore = hashtags.length > limit
    const pageResults = hashtags.slice(0, limit)

    return {
      results: pageResults.map(h => ({
        id: h.id,
        tag: h.tag,
        usageCount: h._count.factHashtags
      })),
      hasMore
    }
  }

  async extractHashtags (content: string): Promise<string[]> {
    const regex = /#([a-zA-Z0-9_]+)/g
    const matches = content.match(regex)
    if (matches === null) return []

    // Normalize: remove # prefix, lowercase, deduplicate
    const tags = matches.map(tag => tag.substring(1).toLowerCase())
    return [...new Set(tags)]
  }
}
