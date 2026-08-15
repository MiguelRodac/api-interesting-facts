import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

const avatarOptions = [
  // vibrent (1-27) - Purple/Indigo
  ...Array.from({ length: 27 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_${i + 1}.png`,
    color: '#6366f1'
  })),
  // 3d (1-5) - Violet
  ...Array.from({ length: 5 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_${i + 1}.png`,
    color: '#8b5cf6'
  })),
  // bluey (1-10) - Blue
  ...Array.from({ length: 10 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_${i + 1}.png`,
    color: '#3b82f6'
  })),
  // memo (1-35) - Amber
  ...Array.from({ length: 35 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_${i + 1}.png`,
    color: '#f59e0b'
  })),
  // notion (1-15) - Dark/Gray
  ...Array.from({ length: 15 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_${i + 1}.png`,
    color: '#1f2937'
  })),
  // teams (1-9) - Steel
  ...Array.from({ length: 9 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_${i + 1}.png`,
    color: '#506e89'
  })),
  // toon (1-10) - Pink
  ...Array.from({ length: 10 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_${i + 1}.png`,
    color: '#ec4899'
  })),
  // upstream (1-22) - Emerald
  ...Array.from({ length: 22 }, (_, i) => ({
    url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_${i + 1}.png`,
    color: '#10b981'
  })),
  // Standalone color swatches (no url)
  { url: null, color: '#ef4444' }, // Red
  { url: null, color: '#f97316' }, // Orange
  { url: null, color: '#f59e0b' }, // Amber
  { url: null, color: '#eab308' }, // Yellow
  { url: null, color: '#84cc16' }, // Lime
  { url: null, color: '#22c55e' }, // Green
  { url: null, color: '#10b981' }, // Emerald
  { url: null, color: '#14b8a6' }, // Teal
  { url: null, color: '#06b6d4' }, // Cyan
  { url: null, color: '#0ea5e9' }, // Sky
  { url: null, color: '#3b82f6' }, // Blue
  { url: null, color: '#6366f1' }, // Indigo
  { url: null, color: '#8b5cf6' }, // Violet
  { url: null, color: '#a855f7' }, // Purple
  { url: null, color: '#d946ef' }, // Fuchsia
  { url: null, color: '#ec4899' }, // Pink
  { url: null, color: '#f43f5e' }, // Rose
  { url: null, color: '#78716c' }, // Stone
  { url: null, color: '#71717a' }, // Zinc
  { url: null, color: '#64748b' }, // Slate
  { url: null, color: '#1f2937' }, // Gray 800
  { url: null, color: '#111827' }  // Gray 900
]

async function seed (): Promise<void> {
  console.log('🗑️  Clearing existing avatar options...')
  await prisma.avatarOption.deleteMany()

  console.log('🌱 Seeding avatar options...')
  const created = await prisma.avatarOption.createMany({
    data: avatarOptions.map((opt) => ({
      url: opt.url,
      color: opt.color
    }))
  })

  console.log(`✅ Created ${created.count} avatar options`)
  console.log(`   - 133 avatars from alohe/avatars catalog`)
  console.log(`   - 22 standalone color swatches`)

  await prisma.$disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
