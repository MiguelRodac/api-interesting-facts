import { type MentionRepository } from '../../domain/ports/MentionRepository'
import { type MentionItem } from '../../domain/models/MentionItem'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface MentionItemResponse {
  id: string
  type: 'fact' | 'comment'
  author: MentionItem['author']
  createdAt: string
  fact?: MentionItem['fact']
  comment?: MentionItem['comment']
}

export class GetMentionsByUser {
  private readonly mentionRepository: MentionRepository

  constructor (mentionRepository: MentionRepository) {
    this.mentionRepository = mentionRepository
  }

  async execute (mentionedUserId: string, params?: BaseQueryParams): Promise<ResultWithPagination<MentionItemResponse>> {
    const { results: mentions, ...pagination } = await this.mentionRepository.findMentionsForUser(mentionedUserId, params)

    return {
      results: mentions.map(mention => ({
        id: mention.id,
        type: mention.type,
        author: mention.author,
        createdAt: mention.createdAt.toISOString(),
        fact: mention.fact,
        comment: mention.comment
      })),
      ...pagination
    }
  }
}
