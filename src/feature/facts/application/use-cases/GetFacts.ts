import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetFacts {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (params?: BaseQueryParams): Promise<ResultWithPagination<FactResponse>> {
    const { results: facts, ...pagination } = await this.factRepository.findAll(params)

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
