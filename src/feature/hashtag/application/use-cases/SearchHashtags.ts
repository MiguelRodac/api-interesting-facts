import { type PrismaHashtagRepository } from '../../infrastructure/repositories/PrismaHashtagRepository'
import { type HashtagPreview } from '../dto/HashtagPreview'

export class SearchHashtags {
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (hashtagRepository: PrismaHashtagRepository) {
    this.hashtagRepository = hashtagRepository
  }

  async execute (query: string): Promise<HashtagPreview[]> {
    const hashtags = await this.hashtagRepository.findByTagUsed(query)
    return hashtags.map(h => ({ id: h.id, tag: h.tag }))
  }
}
