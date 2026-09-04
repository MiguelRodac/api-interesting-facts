import { type Repost } from '../entities/Repost'
import { type RepostWithUser } from '../models/RepostWithUser'
import { type RepostWithFact } from '../models/RepostWithFact'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface RepostRepository {
  findById: (id: string) => Promise<Repost | null>
  findByIdWithAuthor: (id: string) => Promise<RepostWithUser | null>
  findByAuthorAndFact: (authorId: string, originalFactId: string) => Promise<Repost | null>
  findByFactId: (originalFactId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<RepostWithUser>>
  findAllWithFact: (params?: BaseQueryParams) => Promise<ResultWithPagination<RepostWithFact>>
  findByAuthorWithFact: (authorId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<RepostWithFact>>
  findByAuthorsWithFact: (authorIds: string[], params?: BaseQueryParams) => Promise<ResultWithPagination<RepostWithFact>>
  findByFactIdsWithFact: (factIds: string[], params?: BaseQueryParams) => Promise<ResultWithPagination<RepostWithFact>>
  findByIdsWithFact: (ids: string[]) => Promise<RepostWithFact[]>

  create: (authorId: string, originalFactId: string) => Promise<Repost>
  delete: (authorId: string, originalFactId: string) => Promise<void>
}
