import { type Fact } from '../../domain/entities/Fact'
import { type FactRepository } from '../../domain/ports/FactRepository'

export class GetPopularFacts {
  constructor (private readonly repository: FactRepository) {}

  async execute (): Promise<Fact[]> {
    return await this.repository.findPopular()
  }
}
