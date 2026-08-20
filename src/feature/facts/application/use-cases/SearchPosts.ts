import { type FactRepository } from '../../domain/ports/FactRepository'
import { type FactResponse } from '../dto/FactResponse'
import { type SearchOrderParams } from '@shared/domain/types/query-filters'

export class SearchPosts {
  private readonly factRepository: FactRepository

  constructor (factRepository: FactRepository) {
    this.factRepository = factRepository
  }

  async execute (query: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<FactResponse[]> {
    const limit = orderParams?.limit ?? 10
    const { results: facts } = await this.factRepository.findByTitleOrHashtag(query, { page: 1, limit }, viewerId, orderParams)

    return facts.map(fact => ({
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
    }))
  }

  async executeByAuthorOrMention (query: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<FactResponse[]> {
    const limit = orderParams?.limit ?? 10
    const { results: facts } = await this.factRepository.findByAuthorOrMention(query, { page: 1, limit }, viewerId, orderParams)

    return facts.map(fact => ({
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
    }))
  }

  async executeByHashtag (tag: string, viewerId?: string, orderParams?: SearchOrderParams): Promise<FactResponse[]> {
    const limit = orderParams?.limit ?? 10
    const { results: facts } = await this.factRepository.findByHashtag(tag, { page: 1, limit }, viewerId, orderParams)

    return facts.map(fact => ({
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
    }))
  }
}
