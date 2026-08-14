import { type Fact, type CreateFactData, type UpdateFactData } from '../entities/Fact'
import { type FactView } from '../models/FactView'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface FactRepository {
  findById: (id: string, viewerId?: string) => Promise<FactView | null>
  findByAuthorId: (authorId: string, params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  findAll: (params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  findPopular: (params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  findByTitleOrHashtag: (query: string, params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  findByHashtag: (tag: string, params?: BaseQueryParams, viewerId?: string) => Promise<ResultWithPagination<FactView>>
  create: (data: CreateFactData) => Promise<Fact>
  update: (id: string, data: UpdateFactData) => Promise<Fact>
  delete: (id: string) => Promise<void>
}
