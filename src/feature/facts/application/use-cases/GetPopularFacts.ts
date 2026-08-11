import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { type BaseQueryParams, type ResultWithPagination } from '../../../../shared/domain/types/query-filters'

export class GetPopularFacts {
  constructor (private readonly repository: FactRepository) {}

  async execute (params?: BaseQueryParams): Promise<ResultWithPagination<FactResponse>> {
    const { items: facts, total } = await this.repository.findPopular(params)
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
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
