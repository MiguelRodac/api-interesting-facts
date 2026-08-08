import { type Like } from '../entities/Like'

export interface LikeRepository {
  findByUserAndFact: (userId: string, factId: string) => Promise<Like | null>
  create: (userId: string, factId: string) => Promise<Like>
  delete: (userId: string, factId: string) => Promise<void>
}
