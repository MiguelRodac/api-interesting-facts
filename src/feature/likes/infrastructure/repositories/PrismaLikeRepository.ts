import prisma from '../../../../shared/infrastructure/prisma'
import { type Like } from '../../domain/entities/Like'
import { type LikeRepository } from '../../domain/ports/LikeRepository'

export class PrismaLikeRepository implements LikeRepository {
  async findByUserAndFact (userId: string, factId: string): Promise<Like | null> {
    const like = await prisma.like.findUnique({
      where: {
        userId_factId: { userId, factId }
      }
    })

    if (like == null) return null

    return {
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      createdAt: like.createdAt
    }
  }

  async findByFactId (factId: string): Promise<Like[]> {
    const likes = await prisma.like.findMany({
      where: { factId },
      orderBy: { createdAt: 'desc' }
    })

    return likes.map(like => ({
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      createdAt: like.createdAt
    }))
  }

  async findByUserId (userId: string): Promise<Like[]> {
    const likes = await prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return likes.map(like => ({
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      createdAt: like.createdAt
    }))
  }

  async create (userId: string, factId: string): Promise<Like> {
    const like = await prisma.like.create({
      data: {
        userId,
        factId
      }
    })

    return {
      id: like.id,
      userId: like.userId,
      factId: like.factId,
      createdAt: like.createdAt
    }
  }

  async delete (userId: string, factId: string): Promise<void> {
    await prisma.like.delete({
      where: {
        userId_factId: { userId, factId }
      }
    })
  }
}
