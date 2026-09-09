import prisma from '@shared/infrastructure/prisma'
import { type User, type CreateUserData, type UpdateUserData } from '../../domain/entities/User'
import { type UserRepository } from '../../domain/ports/UserRepository'
import { buildPaginatedResult, type ResultWithPagination, type SearchOrderParams } from '@shared/domain/types/query-filters'

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

  async findBySearch (query: string, orderParams?: SearchOrderParams): Promise<ResultWithPagination<User>> {
    const orderBy = orderParams?.order_by ?? 'popular'
    const dir = orderParams?.order_dir === 'asc' ? 'asc' : 'desc'
    const limit = orderParams?.limit ?? 10
    const page = orderParams?.page ?? (orderParams?.skip != null && limit > 0 ? Math.floor(orderParams.skip / limit) + 1 : 1)
    const skip = orderParams?.skip ?? (page - 1) * limit

    const where = {
      OR: [
        { username: { startsWith: query, mode: 'insensitive' as const } },
        { displayName: { contains: query, mode: 'insensitive' as const } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy === 'recent'
          ? { createdAt: dir }
          : { facts: { _count: dir } }
      }),
      prisma.user.count({ where })
    ])

    const mappedUsers = users.map(user => ({
      id: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    }))

    return buildPaginatedResult(mappedUsers, total, page, limit)
  }

  async findUidsByUsernames (usernames: string[]): Promise<Map<string, string>> {
    if (usernames.length === 0) return new Map()

    const users = await prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { username: true, firebaseUid: true }
    })

    return new Map(users.map(user => [user.username, user.firebaseUid]))
  }

  async existsByUsername (username: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { username }
    })
    return count > 0
  }

  async findByEmail (email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email }
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

  async existsByEmail (email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email }
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
