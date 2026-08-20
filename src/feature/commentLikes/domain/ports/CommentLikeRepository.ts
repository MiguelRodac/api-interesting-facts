import { type CommentLike } from '../entities/CommentLike'
import { type CommentLikeWithUser } from '../models/CommentLikeWithUser'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface CommentLikeRepository {
  findByUserAndComment: (userId: string, commentId: string) => Promise<CommentLike | null>
  findByCommentId: (commentId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<CommentLikeWithUser>>
  create: (userId: string, commentId: string) => Promise<CommentLike>
  delete: (userId: string, commentId: string) => Promise<void>
}
