import prisma from '../../../../shared/infrastructure/prisma'
import { type Fact, type CreateFactData, type UpdateFactData } from '../../domain/entities/Fact'
import { type FactRepository } from '../../domain/ports/FactRepository'

export class PrismaFactRepository implements FactRepository {
  async findById (id: string): Promise<Fact | null> {
    const fact = await prisma.fact.findUnique({
      where: { id }
    })

    if (fact == null) return null

    return {
      id: fact.id,
      authorId: fact.authorId,
      title: fact.title,
      content: fact.content,
      createdAt: fact.createdAt,
      updatedAt: fact.updatedAt
    }
  }

  async findByAuthorId (authorId: string): Promise<Fact[]> {
    const facts = await prisma.fact.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' }
    })

    return facts.map(fact => ({
      id: fact.id,
      authorId: fact.authorId,
      title: fact.title,
      content: fact.content,
      createdAt: fact.createdAt,
      updatedAt: fact.updatedAt
    }))
  }

  async findAll (): Promise<Fact[]> {
    const facts = await prisma.fact.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return facts.map(fact => ({
      id: fact.id,
      authorId: fact.authorId,
      title: fact.title,
      content: fact.content,
      createdAt: fact.createdAt,
      updatedAt: fact.updatedAt
    }))
  }

  async create (data: CreateFactData): Promise<Fact> {
    const fact = await prisma.fact.create({
      data: {
        authorId: data.authorId,
        title: data.title ?? null,
        content: data.content
      }
    })

    return {
      id: fact.id,
      authorId: fact.authorId,
      title: fact.title,
      content: fact.content,
      createdAt: fact.createdAt,
      updatedAt: fact.updatedAt
    }
  }

  async update (id: string, data: UpdateFactData): Promise<Fact> {
    const fact = await prisma.fact.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content
      }
    })

    return {
      id: fact.id,
      authorId: fact.authorId,
      title: fact.title,
      content: fact.content,
      createdAt: fact.createdAt,
      updatedAt: fact.updatedAt
    }
  }

  async delete (id: string): Promise<void> {
    await prisma.fact.delete({
      where: { id }
    })
  }
}
