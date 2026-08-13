import { PrismaClient } from '@prisma/client'

const isDev = process.env.NODE_ENV !== 'production'

export const prisma = new PrismaClient({
  log: isDev ? ['query', 'error'] : ['error']
})

export default prisma
