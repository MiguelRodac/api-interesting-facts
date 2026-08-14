import prisma from '@shared/infrastructure/prisma'
import { type User, type CreateUserData, type UpdateUserData } from '../../domain/entities/User'
import { type UserRepository } from '../../domain/ports/UserRepository'
import { type SearchOrderParams } from '@shared/domain/types/query-filters'

export class PrismaUserRepository implements UserRepository {
  async findById (id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: id }
    })

    if (user == null) return null

    return {
      id: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    }
  }

  async findByFirebaseUid (firebaseUid: string): Promise<User | null> {
    return await this.findById(firebaseUid)
  }

  async findByUsername (username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (user == null) return null

    return {
      id: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    }
  }

  async findBySearch (query: string, orderParams?: SearchOrderParams): Promise<User[]> {
    const orderBy = orderParams?.order_by ?? 'popular'
    const dir = orderParams?.order_dir === 'asc' ? 'asc' : 'desc'

    // For "popular" ordering by fact count, we fetch with _count and sort in memory
    // For "recent" ordering, we sort by createdAt directly in the query
    if (orderBy === 'recent') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { startsWith: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        orderBy: { createdAt: dir }
      })

      return users.map(user => ({
        id: user.firebaseUid,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt
      }))
    }

    // Popular: order by fact count
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: { facts: true }
        }
      },
      take: 50 // fetch more to sort by count, then slice
    })

    // Sort by fact count and take top 10
    users.sort((a, b) => dir === 'desc'
      ? b._count.facts - a._count.facts
      : a._count.facts - b._count.facts
    )

    return users.slice(0, 10).map(user => ({
      id: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    }))
  }

  async existsByUsername (username: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { username }
    })
    return count > 0
  }

  async create (data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl ?? null
      }
    })

    return {
      id: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    }
  }

  async update (id: string, data: UpdateUserData): Promise<User> {
    const user = await prisma.user.update({
      where: { firebaseUid: id },
      data: {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        avatarColor: data.avatarColor,
        email: data.email
      }
    })

    return {
      id: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    }
  }
}
