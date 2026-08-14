import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'

export class SearchPosts {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (query: string, viewerId?: string): Promise<FactResponse[]> {
    const { results: facts } = await this.factRepository.findByTitleOrHashtag(query, { page: 1, limit: 10 }, viewerId)

    return facts.map(fact => ({
      id: fact.id,
      author: fact.author,
      title: fact.title,
      content: fact.content,
      likes: fact.likes,
      liked: fact.liked,
      hashtags: fact.hashtags,
      createdAt: fact.createdAt.toISOString(),
      updatedAt: fact.updatedAt.toISOString()
    }))
  }
}
