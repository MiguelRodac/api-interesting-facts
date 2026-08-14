import { PrismaClient } from '@prisma/client'

const isDev = process.env.NODE_ENV !== 'production'

export const prisma = new PrismaClient({
  log: isDev
    ? [
        { emit: 'event', level: 'query' as const },
        { emit: 'stdout', level: 'error' as const }
      ]
    : [{ emit: 'stdout', level: 'error' as const }]
})

if (isDev) {
  prisma.$on('query', (event) => {
    const params = event.params !== '[]' ? ` | params: ${event.params}` : ''
    console.log(`\u001b[36m[SQL]\u001b[39m ${event.query}${params}`)
  })
}

export default prisma
