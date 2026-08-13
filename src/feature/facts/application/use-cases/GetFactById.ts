import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { FactNotFoundError } from '../../domain/errors/FactNotFoundError'

export class GetFactById {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (id: string): Promise<FactResponse> {
    const fact = await this.factRepository.findById(id)

    if (fact == null) {
      throw new FactNotFoundError()
    }

    return {
      id: fact.id,
      author: fact.author,
      title: fact.title,
      content: fact.content,
      likes: fact.likes,
      createdAt: fact.createdAt.toISOString(),
      updatedAt: fact.updatedAt.toISOString()
    }
  }
}
