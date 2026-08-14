import { type PrismaHashtagRepository } from '../../infrastructure/repositories/PrismaHashtagRepository'
import { type HashtagWithUsage } from '../dto/HashtagWithUsage'

export class GetHashtags {
  private readonly hashtagRepository: PrismaHashtagRepository

  constructor (hashtagRepository: PrismaHashtagRepository) {
    this.hashtagRepository = hashtagRepository
  }

  async execute (query?: string, limit: number = 10): Promise<HashtagWithUsage[]> {
    return await this.hashtagRepository.findPopular(query, limit)
  }
}
