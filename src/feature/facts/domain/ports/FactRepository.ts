import { type Fact, type CreateFactData, type UpdateFactData } from '../entities/Fact'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface FactRepository {
  findById: (id: string) => Promise<Fact | null>
  findByAuthorId: (authorId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<Fact>>
  findAll: (params?: BaseQueryParams) => Promise<ResultWithPagination<Fact>>
  findPopular: (params?: BaseQueryParams) => Promise<ResultWithPagination<Fact>>
  create: (data: CreateFactData) => Promise<Fact>
  update: (id: string, data: UpdateFactData) => Promise<Fact>
  delete: (id: string) => Promise<void>
}
