import { type FactRepository } from '../../domain/ports/FactRepository'
import { type UpdateFactInput } from '../dto/CreateFactInput'
import { type FactResponse } from '../dto/FactResponse'
import { FactNotFoundError } from '../../domain/errors/FactNotFoundError'
import { FactForbiddenError } from '../../domain/errors/FactForbiddenError'
import { ContentTooShortError } from '../../domain/errors/ContentTooShortError'
import { ContentTooLongError } from '../../domain/errors/ContentTooLongError'

const MIN_CONTENT_LENGTH = 10
const MAX_CONTENT_LENGTH = 200

export class UpdateFact {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
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

    const updatedFact = await this.factRepository.update(id, {
      title: data.title,
      content: data.content
    })

    return {
      id: updatedFact.id,
      authorId: updatedFact.authorId,
      title: updatedFact.title,
      content: updatedFact.content,
      createdAt: updatedFact.createdAt.toISOString(),
      updatedAt: updatedFact.updatedAt.toISOString()
    }
  }
}
