import { type InterestingFact, type InterestingFactAdd } from './types'
import { type FactRepository } from './repository'
import { NotFoundError } from '../../shared/errors/NotFoundError'
import { ValidationError } from '../../shared/errors/ValidationError'

export class InterestingFactsService {
  private readonly repository: FactRepository

  constructor (repository: FactRepository) {
    this.repository = repository
  }

  async getAll (): Promise<InterestingFact[]> {
    return await this.repository.findAll()
  }

  async getById (id: string): Promise<InterestingFact> {
    const fact = await this.repository.findById(id)
    if (fact == null) {
      throw new NotFoundError(`Interesting fact with id ${id} not found`)
    }
    return fact
  }

  async create (data: InterestingFactAdd): Promise<InterestingFact> {
    const allFacts = await this.repository.findAll()
    const duplicate = allFacts.find(
      (f) => f.title.toLowerCase() === data.title.toLowerCase() ||
        f.description.toLowerCase() === data.description.toLowerCase()
    )
    if (duplicate != null) {
      throw new ValidationError('A fact with the same title or description already exists', {
        title: 'Duplicate title or description'
      })
    }
    return await this.repository.create(data)
  }

  async update (id: string, data: InterestingFactAdd): Promise<InterestingFact> {
    const existing = await this.repository.findById(id)
    if (existing == null) {
      throw new NotFoundError(`Interesting fact with id ${id} not found`)
    }

    const allFacts = await this.repository.findAll()
    const duplicate = allFacts.find(
      (f) => f.id !== id &&
        (f.title.toLowerCase() === data.title.toLowerCase() ||
          f.description.toLowerCase() === data.description.toLowerCase())
    )
    if (duplicate != null) {
      throw new ValidationError('A fact with the same title or description already exists', {
        title: 'Duplicate title or description'
      })
    }

    return await this.repository.update(id, data)
  }

  async delete (id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (existing == null) {
      throw new NotFoundError(`Interesting fact with id ${id} not found`)
    }
    await this.repository.delete(id)
  }
}
