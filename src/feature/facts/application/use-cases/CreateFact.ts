import { type FactRepository } from '../../domain/ports/FactRepository'
import { type CreateFactInput } from '../dto/CreateFactInput'
import { type FactResponse } from '../dto/FactResponse'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'
import { TitleTooLongError } from '../../domain/errors/TitleTooLongError'
import { PrismaHashtagRepository } from '@hashtag/infrastructure/repositories/PrismaHashtagRepository'
import { FACT_TITLE_MAX_LENGTH, FACT_CONTENT_MIN_LENGTH, FACT_CONTENT_MAX_LENGTH, validateMentions } from '@shared/domain/validation'

export class CreateFact {
  private readonly factRepository: FactRepository
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
    this.hashtagRepository = new PrismaHashtagRepository()
  }

  async execute (data: CreateFactInput, authorId: string): Promise<FactResponse> {
    const content = data.content.trim()

    if (content.length < FACT_CONTENT_MIN_LENGTH) {
      throw new ContentTooShortError(FACT_CONTENT_MIN_LENGTH)
    }

    if (content.length > FACT_CONTENT_MAX_LENGTH) {
      throw new ContentTooLongError(FACT_CONTENT_MAX_LENGTH)
    }

    if (data.title != null && data.title.length > FACT_TITLE_MAX_LENGTH) {
      throw new TitleTooLongError(FACT_TITLE_MAX_LENGTH)
    }

    validateMentions(content)

    const fact = await this.factRepository.create({
      authorId,
      title: data.title,
      content
    })

    // Extract and store hashtags
    const tagNames = await this.hashtagRepository.extractHashtags(content)
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
      likeBy: enrichedFact.likeBy,
      comments: enrichedFact.comments,
      commentsDetails: enrichedFact.commentsDetails,
      repostCount: enrichedFact.repostCount,
      repostedByMe: enrichedFact.repostedByMe,
      repostBy: enrichedFact.repostBy,
      hashtags,
      createdAt: enrichedFact.createdAt.toISOString(),
      updatedAt: enrichedFact.updatedAt.toISOString()
    }
  }
}
