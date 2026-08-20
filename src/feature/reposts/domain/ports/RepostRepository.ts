import { type Repost } from '../entities/Repost'
import { type RepostWithUser } from '../models/RepostWithUser'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface RepostRepository {
  findByAuthorAndFact: (authorId: string, originalFactId: string) => Promise<Repost | null>
  findByFactId: (originalFactId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<RepostWithUser>>
  create: (authorId: string, originalFactId: string) => Promise<Repost>
  delete: (authorId: string, originalFactId: string) => Promise<void>
}
