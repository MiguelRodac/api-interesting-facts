import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetFacts {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FactResponse>> {
    const { results: facts, ...pagination } = await this.factRepository.findAll(params, viewerId)

    return {
      results: facts.map(fact => ({
        id: fact.id,
        author: fact.author,
        title: fact.title,
        content: fact.content,
        likes: fact.likes,
        liked: fact.liked,
        hashtags: fact.hashtags,
        createdAt: fact.createdAt.toISOString(),
        updatedAt: fact.updatedAt.toISOString()
      })),
      ...pagination
    }
  }
}
