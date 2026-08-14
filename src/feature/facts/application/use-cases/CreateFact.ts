import { type FactRepository } from '../../domain/ports/FactRepository'
import { type CreateFactInput } from '../dto/CreateFactInput'
import { type FactResponse } from '../dto/FactResponse'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'
import { PrismaHashtagRepository } from '@hashtag/infrastructure/repositories/PrismaHashtagRepository'

const MIN_CONTENT_LENGTH = 10
const MAX_CONTENT_LENGTH = 200

export class CreateFact {
  private readonly factRepository: FactRepository
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
    this.hashtagRepository = new PrismaHashtagRepository()
  }

  async execute (data: CreateFactInput, authorId: string): Promise<FactResponse> {
    if (data.content.length < MIN_CONTENT_LENGTH) {
      throw new ContentTooShortError(MIN_CONTENT_LENGTH)
    }

    if (data.content.length > MAX_CONTENT_LENGTH) {
      throw new ContentTooLongError(MAX_CONTENT_LENGTH)
    }

    const fact = await this.factRepository.create({
      authorId,
      title: data.title,
      content: data.content
    })

    // Extract and store hashtags
    const tagNames = await this.hashtagRepository.extractHashtags(data.content)
    let hashtags: Array<{ id: string, tag: string }> = []
    if (tagNames.length > 0) {
      hashtags = await this.hashtagRepository.replaceFactHashtags(fact.id, tagNames)
    }

    const enrichedFact = await this.factRepository.findById(fact.id)

    if (enrichedFact == null) {
      throw new Error('Failed to fetch created fact')
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
