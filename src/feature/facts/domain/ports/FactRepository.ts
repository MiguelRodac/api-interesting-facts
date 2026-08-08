import { type Fact, type CreateFactData, type UpdateFactData } from '../entities/Fact'

export interface FactRepository {
  findById: (id: string) => Promise<Fact | null>
  findByAuthorId: (authorId: string) => Promise<Fact[]>
  findAll: () => Promise<Fact[]>
  findPopular: () => Promise<Fact[]>
  create: (data: CreateFactData) => Promise<Fact>
  update: (id: string, data: UpdateFactData) => Promise<Fact>
  delete: (id: string) => Promise<void>
}
