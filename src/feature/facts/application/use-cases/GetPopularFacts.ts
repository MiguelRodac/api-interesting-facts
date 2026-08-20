import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export class GetPopularFacts {
  constructor (private readonly repository: FactRepository) {}

  async execute (params?: BaseQueryParams, viewerId?: string): Promise<ResultWithPagination<FactResponse>> {
    const { results: facts, ...pagination } = await this.repository.findPopular(params, viewerId)

    return {
      results: facts.map(fact => ({
        id: fact.id,
        author: fact.author,
        title: fact.title,
        content: fact.content,
        likes: fact.likes,
        liked: fact.liked,
        likeBy: fact.likeBy,
        comments: fact.comments,
        commentsDetails: fact.commentsDetails,
        repostCount: fact.repostCount,
        repostedByMe: fact.repostedByMe,
        repostBy: fact.repostBy,
        hashtags: fact.hashtags,
        createdAt: fact.createdAt.toISOString(),
        updatedAt: fact.updatedAt.toISOString()
      })),
      ...pagination
    }
  }
}
