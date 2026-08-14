import { type PrismaHashtagRepository } from '../../infrastructure/repositories/PrismaHashtagRepository'
import { type HashtagPreview } from '../dto/HashtagPreview'
import { type SearchOrderParams } from '@shared/domain/types/query-filters'

export class SearchHashtags {
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (hashtagRepository: PrismaHashtagRepository) {
    this.hashtagRepository = hashtagRepository
  }

  async execute (query: string, orderParams?: SearchOrderParams): Promise<HashtagPreview[]> {
    const hashtags = await this.hashtagRepository.findByTagUsed(query, orderParams)
    return hashtags.map(h => ({ id: h.id, tag: h.tag }))
  }
}
