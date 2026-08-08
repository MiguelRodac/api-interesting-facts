import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'

export class GetFacts {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (): Promise<FactResponse[]> {
    const facts = await this.factRepository.findAll()

    return facts.map(fact => ({
      id: fact.id,
      authorId: fact.authorId,
      title: fact.title,
      content: fact.content,
      createdAt: fact.createdAt.toISOString(),
      updatedAt: fact.updatedAt.toISOString()
    }))
  }
}
