import { type Like } from '../entities/Like'

export interface LikeRepository {
  findByUserAndFact: (userId: string, factId: string) => Promise<Like | null>
  findByFactId: (factId: string) => Promise<Like[]>
  findByUserId: (userId: string) => Promise<Like[]>
  create: (userId: string, factId: string) => Promise<Like>
  delete: (userId: string, factId: string) => Promise<void>
}
