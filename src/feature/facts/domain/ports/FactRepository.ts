import { type Fact, type CreateFactData, type UpdateFactData } from '../entities/Fact'
import { type BaseQueryParams } from '../../../../shared/domain/types/query-filters'

export interface PaginatedFacts {
  items: Fact[]
  total: number
}

export interface FactRepository {
  findById: (id: string) => Promise<Fact | null>
  findByAuthorId: (authorId: string, params?: BaseQueryParams) => Promise<PaginatedFacts>
  findAll: (params?: BaseQueryParams) => Promise<PaginatedFacts>
  findPopular: (params?: BaseQueryParams) => Promise<PaginatedFacts>
  create: (data: CreateFactData) => Promise<Fact>
  update: (id: string, data: UpdateFactData) => Promise<Fact>
  delete: (id: string) => Promise<void>
}
