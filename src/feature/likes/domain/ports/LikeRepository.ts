import { type Like } from '../entities/Like'
import { type BaseQueryParams } from '../../../../shared/domain/types/query-filters'

export interface PaginatedLikes {
  items: Like[]
  total: number
}

export interface LikeRepository {
  findByUserAndFact: (userId: string, factId: string) => Promise<Like | null>
  findByFactId: (factId: string, params?: BaseQueryParams) => Promise<PaginatedLikes>
  findByUserId: (userId: string, params?: BaseQueryParams) => Promise<PaginatedLikes>
  create: (userId: string, factId: string) => Promise<Like>
  delete: (userId: string, factId: string) => Promise<void>
}
