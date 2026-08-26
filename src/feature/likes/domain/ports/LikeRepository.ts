import { type Like } from '../entities/Like'
import { type LikeWithUser } from '../models/LikeWithUser'
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface LikeRepository {
  findByUserAndFact: (userId: string, factId: string) => Promise<Like | null>
  findByUserAndRepost: (userId: string, repostId: string) => Promise<Like | null>
  findByFactId: (factId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<LikeWithUser>>
  findByRepostId: (repostId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<LikeWithUser>>
  findByUserId: (userId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<Like>>
  create: (userId: string, factId: string) => Promise<Like>
  createRepostLike: (userId: string, repostId: string) => Promise<Like>
  delete: (userId: string, factId: string) => Promise<void>
  deleteRepostLike: (userId: string, repostId: string) => Promise<void>
  batchLikeCountsByRepostIds: (repostIds: string[]) => Promise<Map<string, number>>
  batchUserRepostLikes: (repostIds: string[], viewerId: string) => Promise<Set<string>>
  batchRecentRepostLikers: (repostIds: string[], limit?: number) => Promise<Map<string, UserAvatarPreview[]>>
}
