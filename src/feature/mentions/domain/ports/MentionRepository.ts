import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'
import { type MentionItem } from '../models/MentionItem'

export interface MentionRepository {
  // Insert mentions; callers pass resolved factId or commentId and the list of mentioned firebaseUids
  replaceFactMentions: (factId: string, authorId: string, mentionedUserIds: string[]) => Promise<void>
  replaceCommentMentions: (commentId: string, authorId: string, mentionedUserIds: string[]) => Promise<void>
  findMentionsForUser: (mentionedUserId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<MentionItem>>
}
