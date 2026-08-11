import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetFactsByAuthor {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (authorId: string, params?: BaseQueryParams): Promise<ResultWithPagination<FactResponse>> {
    const { results: facts, ...pagination } = await this.factRepository.findByAuthorId(authorId, params)

    return {
      results: facts.map(fact => ({
        id: fact.id,
        authorId: fact.authorId,
        title: fact.title,
        content: fact.content,
        createdAt: fact.createdAt.toISOString(),
        updatedAt: fact.updatedAt.toISOString()
      })),
      ...pagination
    }
  }
}
