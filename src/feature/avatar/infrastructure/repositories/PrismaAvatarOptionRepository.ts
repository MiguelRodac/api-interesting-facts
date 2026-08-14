import prisma from '@shared/infrastructure/prisma'
import { type AvatarOptionResponse } from '../../application/dto/AvatarOptionResponse'

export class PrismaAvatarOptionRepository {
  async findAll (): Promise<AvatarOptionResponse[]> {
    const options = await prisma.avatarOption.findMany({
      orderBy: { createdAt: 'asc' }
    })

    return options.map(option => ({
      id: option.id,
      url: option.url,
      color: option.color
    }))
  }
}
