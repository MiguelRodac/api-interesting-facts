import { type FactRepository } from '../../domain/ports/FactRepository'
import { type UpdateFactInput } from '../dto/CreateFactInput'
import { type FactResponse } from '../dto/FactResponse'
import { FactNotFoundError } from '../../domain/errors/FactNotFoundError'
import { FactForbiddenError } from '../../domain/errors/FactForbiddenError'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'
import { PrismaHashtagRepository } from '@hashtag/infrastructure/repositories/PrismaHashtagRepository'

const MIN_CONTENT_LENGTH = 10
const MAX_CONTENT_LENGTH = 200

export class UpdateFact {
  private readonly factRepository: FactRepository
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
    this.hashtagRepository = new PrismaHashtagRepository()
  }

  async execute (id: string, data: UpdateFactInput, authorId: string): Promise<FactResponse> {
    const existingFact = await this.factRepository.findById(id)

    if (existingFact == null) {
      throw new FactNotFoundError()
    }

    if (existingFact.authorId !== authorId) {
      throw new FactForbiddenError()
    }

    if (data.content !== undefined) {
      if (data.content.length < MIN_CONTENT_LENGTH) {
        throw new ContentTooShortError(MIN_CONTENT_LENGTH)
      }

      if (data.content.length > MAX_CONTENT_LENGTH) {
        throw new ContentTooLongError(MAX_CONTENT_LENGTH)
      }
    }

    await this.factRepository.update(id, {
      title: data.title,
      content: data.content
    })

    // Re-extract and replace hashtags if content changed
    let hashtags = existingFact.hashtags
    if (data.content !== undefined) {
      const tagNames = await this.hashtagRepository.extractHashtags(data.content)
      hashtags = await this.hashtagRepository.replaceFactHashtags(id, tagNames)
    }

    const enrichedFact = await this.factRepository.findById(id)

    if (enrichedFact == null) {
      throw new Error('Failed to fetch updated fact')
    }

    return {
      id: enrichedFact.id,
      author: enrichedFact.author,
      title: enrichedFact.title,
      content: enrichedFact.content,
      likes: enrichedFact.likes,
      hashtags,
      createdAt: enrichedFact.createdAt.toISOString(),
      updatedAt: enrichedFact.updatedAt.toISOString()
    }
  }
}
