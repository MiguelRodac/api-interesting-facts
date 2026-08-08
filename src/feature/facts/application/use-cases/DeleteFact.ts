import { type FactRepository } from '../../domain/ports/FactRepository'
import { FactNotFoundError } from '../../../../shared/domain/errors/FactNotFoundError'
import { FactForbiddenError } from '../../../../shared/domain/errors/FactForbiddenError'

export class DeleteFact {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (id: string, authorId: string): Promise<void> {
    const existingFact = await this.factRepository.findById(id)

    if (existingFact == null) {
      throw new FactNotFoundError()
    }

    if (existingFact.authorId !== authorId) {
      throw new FactForbiddenError()
    }

    await this.factRepository.delete(id)
  }
}
