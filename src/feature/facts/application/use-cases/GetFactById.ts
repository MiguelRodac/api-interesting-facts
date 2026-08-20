import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { FactNotFoundError } from '../../domain/errors/FactNotFoundError'

export class GetFactById {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (id: string, viewerId?: string): Promise<FactResponse> {
    const fact = await this.factRepository.findById(id, viewerId)

    if (fact == null) {
      throw new FactNotFoundError()
    }

    return {
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
    }
  }
}
