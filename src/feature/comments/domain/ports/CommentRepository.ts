import { type Comment } from '../entities/Comment'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface CreateCommentData {
  content: string
  factId: string
  authorId: string
  parentCommentId?: string | null
}

export interface CommentWithAuthor extends Comment {
  author: {
    username: string
    displayName: string
    avatarUrl: string | null
    avatarColor: string | null
  }
  replies?: CommentWithAuthor[]
}

export interface CommentRepository {
  create: (data: CreateCommentData) => Promise<Comment>
  findById: (id: string) => Promise<Comment | null>
  delete: (id: string) => Promise<void>
  findByFactId: (factId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<CommentWithAuthor>>
  findByUserId: (userId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<CommentWithAuthor>>
  countRepliesByParentIds: (parentIds: string[]) => Promise<Map<string, number>>
}
