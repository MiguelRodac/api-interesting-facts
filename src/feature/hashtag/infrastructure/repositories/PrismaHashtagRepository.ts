import prisma from '@shared/infrastructure/prisma'
import { type Hashtag } from '../../domain/models/Hashtag'
import { type HashtagResponse } from '../../application/dto/HashtagResponse'

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

  async findByTagUsed (query: string): Promise<HashtagResponse[]> {
    const normalizedQuery = query.toLowerCase()

    const hashtags = await prisma.hashtag.findMany({
      where: {
        tag: { contains: normalizedQuery }
      },
      include: {
        _count: {
          select: { factHashtags: true }
        }
      },
      orderBy: { tag: 'asc' },
      take: 10
    })

    return hashtags
      .filter(h => h._count.factHashtags > 0)
      .map(h => ({ id: h.id, tag: h.tag }))
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
