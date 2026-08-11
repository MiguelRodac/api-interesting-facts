import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { type BaseQueryParams, type ResultWithPagination } from '../../../../shared/domain/types/query-filters'

export class GetFactsByAuthor {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (authorId: string, params?: BaseQueryParams): Promise<ResultWithPagination<FactResponse>> {
    const { items: facts, total } = await this.factRepository.findByAuthorId(authorId, params)
    const page = params?.page ?? 1
    const limit = params?.limit ?? 10
    const nextPage = page * limit < total ? page + 1 : null

    return {
      results: facts.map(fact => ({
        id: fact.id,
        authorId: fact.authorId,
        title: fact.title,
        content: fact.content,
        createdAt: fact.createdAt.toISOString(),
        updatedAt: fact.updatedAt.toISOString()
      })),
      page,
      limit,
      nextPage
    }
  }
}
