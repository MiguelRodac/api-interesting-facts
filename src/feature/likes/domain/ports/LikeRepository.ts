import { type Like } from '../entities/Like'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface LikeRepository {
  findByUserAndFact: (userId: string, factId: string) => Promise<Like | null>
  findByFactId: (factId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<Like>>
  findByUserId: (userId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<Like>>
  create: (userId: string, factId: string) => Promise<Like>
  delete: (userId: string, factId: string) => Promise<void>
}
