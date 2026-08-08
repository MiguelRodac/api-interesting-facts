import { type FactRepository } from '../../domain/ports/FactRepository'
import { type CreateFactInput } from '../dto/CreateFactInput'
import { type FactResponse } from '../dto/FactResponse'
import { ContentTooShortError } from '../../../../shared/domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../../../shared/domain/errors/ContentTooLongError'

const MIN_CONTENT_LENGTH = 10
const MAX_CONTENT_LENGTH = 200

export class CreateFact {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
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

    return {
      id: fact.id,
      authorId: fact.authorId,
      title: fact.title,
      content: fact.content,
      createdAt: fact.createdAt.toISOString(),
      updatedAt: fact.updatedAt.toISOString()
    }
  }
}
