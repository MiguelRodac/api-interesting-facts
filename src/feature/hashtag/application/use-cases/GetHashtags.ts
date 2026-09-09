import { type PrismaHashtagRepository } from '../../infrastructure/repositories/PrismaHashtagRepository'
import { type HashtagWithUsage } from '../dto/HashtagWithUsage'

export interface GetHashtagsResult {
  results: HashtagWithUsage[]
  hasMore: boolean
}

export class GetHashtags {
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (hashtagRepository: PrismaHashtagRepository) {
    this.hashtagRepository = hashtagRepository
  }

  async execute (query?: string, page: number = 1, limit: number = 10): Promise<GetHashtagsResult> {
    return await this.hashtagRepository.findPopular(query, page, limit)
  }
}
