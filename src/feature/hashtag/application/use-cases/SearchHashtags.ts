import { type PrismaHashtagRepository } from '../../infrastructure/repositories/PrismaHashtagRepository'
import { type HashtagPreview } from '../dto/HashtagPreview'
import { type SearchOrderParams } from '@shared/domain/types/query-filters'

export interface SearchHashtagsResult {
  results: HashtagPreview[]
  hasMore: boolean
}

export class SearchHashtags {
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (hashtagRepository: PrismaHashtagRepository) {
    this.hashtagRepository = hashtagRepository
  }

  async execute (query: string, orderParams?: SearchOrderParams): Promise<SearchHashtagsResult> {
    const result = await this.hashtagRepository.findByTagUsed(query, orderParams)
    return {
      results: result.results.map(h => ({ id: h.id, tag: h.tag })),
      hasMore: result.nextPage !== null
    }
  }
}
