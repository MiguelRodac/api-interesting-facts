import { type Fact, type CreateFactData, type UpdateFactData } from '../entities/Fact'
import { type BaseQueryParams, type ResultWithPagination } from '@shared/domain/types/query-filters'

export interface EnrichedFact {
  id: string
  authorId: string
  author: { username: string, email: string, displayName: string }
  title: string | null
  content: string
  likes: number
  createdAt: Date
  updatedAt: Date
}

export interface FactRepository {
  findById: (id: string) => Promise<EnrichedFact | null>
  findByAuthorId: (authorId: string, params?: BaseQueryParams) => Promise<ResultWithPagination<EnrichedFact>>
  findAll: (params?: BaseQueryParams) => Promise<ResultWithPagination<EnrichedFact>>
  findPopular: (params?: BaseQueryParams) => Promise<ResultWithPagination<EnrichedFact>>
  create: (data: CreateFactData) => Promise<Fact>
  update: (id: string, data: UpdateFactData) => Promise<Fact>
  delete: (id: string) => Promise<void>
}
