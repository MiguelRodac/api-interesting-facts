import prisma from '@shared/infrastructure/prisma'
import { type User, type CreateUserData, type UpdateUserData } from '../../domain/entities/User'
import { type UserRepository } from '../../domain/ports/UserRepository'

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
      createdAt: user.createdAt
    }
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
      createdAt: user.createdAt
    }
  }

  async update (id: string, data: UpdateUserData): Promise<User> {
    const user = await prisma.user.update({
      where: { firebaseUid: id },
      data: {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl
      }
    })

    return {
      id: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt
    }
  }
}
