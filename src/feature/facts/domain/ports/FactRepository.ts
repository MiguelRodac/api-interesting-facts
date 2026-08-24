import { type Fact, type CreateFactData, type UpdateFactData } from '../entities/Fact'
import { type FactView } from '../models/FactView'
import { type BaseQueryParams, type ResultWithPagination, type SearchOrderParams } from '@shared/domain/types/query-filters'
import { type UserAvatarPreview } from '@shared/domain/types/UserAvatarPreview'
import { type CommentPreview } from '@comments/application/dto/CommentPreview'

export interface EnrichmentMaps {
  likeCountMap: Map<string, number>
  commentCountMap: Map<string, number>
  likeByMap: Map<string, UserAvatarPreview[]>
  commentsDetailsMap: Map<string, CommentPreview | null>
  repostCountMap: Map<string, number>
  repostByMap: Map<string, UserAvatarPreview[]>
  hashtagsMap: Map<string, Array<{ id: string, tag: string }>>
}

export interface FactRepository {
  findById: (id: string, viewerId?: string) => Promise<FactView | null>
  findByIds: (ids: string[], viewerId?: string) => Promise<FactView[]>
  findByAuthorId: (authorId: string, params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  findAll: (params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  findPopular: (params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  findByTitleOrHashtag: (query: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams) => Promise<ResultWithPagination<FactView>>
  findByAuthorOrMention: (query: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams) => Promise<ResultWithPagination<FactView>>
  findByHashtag: (tag: string, params?: BaseQueryParams, viewerId?: string, orderParams?: SearchOrderParams) => Promise<ResultWithPagination<FactView>>
  create: (data: CreateFactData) => Promise<Fact>
  update: (id: string, data: UpdateFactData) => Promise<Fact>
  delete: (id: string) => Promise<void>

  findRawByIds: (ids: string[]) => Promise<Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>>
  findRawAll: (params?: BaseQueryParams) => Promise<{ facts: Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>, total: number }>
  batchBuildEnrichmentMaps: (factIds: string[]) => Promise<EnrichmentMaps>
  batchEnrichFacts: (facts: Array<{ id: string, authorId: string, author: { firebaseUid: string, username: string, email: string, displayName: string, avatarUrl: string | null, avatarColor: string | null }, title: string | null, content: string, createdAt: Date, updatedAt: Date }>, enrichmentMaps: EnrichmentMaps, viewerId?: string) => Promise<FactView[]>
  batchViewerContext: (factIds: string[], viewerId: string) => Promise<{ viewerLikedSet: Set<string>, viewerRepostedSet: Set<string> }>
}
