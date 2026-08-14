import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

const AVATAR_COLORS = [
  '#E57373', '#F06292', '#BA68C8', '#7986CB',
  '#64B5F6', '#4DD0E1', '#4DB6AC', '#81C784',
  '#AED581', '#DCE775', '#FFD54F', '#FFB74D',
  '#A1887F', '#90A4AE', '#F48FB1', '#CE93D8'
]

async function seed (): Promise<void> {
  console.log('🌱 Seeding avatar_options...')

  // Check if table already has data
  const existing = await prisma.avatarOption.count()
  if (existing > 0) {
    console.log(`⏭️  Table already has ${existing} rows — skipping insert`)
    return
  }

  // Build VALUES with explicit UUIDs — DB id column is text NOT NULL with no default
  const values = AVATAR_COLORS
    .map((color) => `('${randomUUID()}', NULL, '${color}', NOW())`)
    .join(',\n    ')

  await prisma.$executeRawUnsafe(`
    INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
    ${values}
  `)

  const count = await prisma.avatarOption.count()
  console.log(`\n✅ Seed complete: ${count} avatar color presets inserted`)
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
