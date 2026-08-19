import { type FactRepository } from '../../domain/ports/FactRepository'
import { type UpdateFactInput } from '../dto/CreateFactInput'
import { type FactResponse } from '../dto/FactResponse'
import { FactNotFoundError } from '../../domain/errors/FactNotFoundError'
import { FactForbiddenError } from '../../domain/errors/FactForbiddenError'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'
import { TitleTooLongError } from '../../domain/errors/TitleTooLongError'
import { PrismaHashtagRepository } from '@hashtag/infrastructure/repositories/PrismaHashtagRepository'
import { FACT_TITLE_MAX_LENGTH, FACT_CONTENT_MIN_LENGTH, FACT_CONTENT_MAX_LENGTH, validateMentions } from '@shared/domain/validation'

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

    if (data.title != null && data.title.length > FACT_TITLE_MAX_LENGTH) {
      throw new TitleTooLongError(FACT_TITLE_MAX_LENGTH)
    }

    let normalizedContent: string | undefined
    if (data.content !== undefined) {
      normalizedContent = data.content.trim()

      if (normalizedContent.length < FACT_CONTENT_MIN_LENGTH) {
        throw new ContentTooShortError(FACT_CONTENT_MIN_LENGTH)
      }

      if (normalizedContent.length > FACT_CONTENT_MAX_LENGTH) {
        throw new ContentTooLongError(FACT_CONTENT_MAX_LENGTH)
      }

      validateMentions(normalizedContent)
    }

    await this.factRepository.update(id, {
      title: data.title,
      content: normalizedContent
    })

    // Re-extract and replace hashtags if content changed
    let hashtags = existingFact.hashtags
    if (normalizedContent !== undefined) {
      const tagNames = await this.hashtagRepository.extractHashtags(normalizedContent)
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
