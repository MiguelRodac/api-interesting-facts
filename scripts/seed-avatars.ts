import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function seed (): Promise<void> {
  console.log('🗑️  Clearing avatar_options...')
  await prisma.avatarOption.deleteMany()

  console.log('🌱 Seeding 157 avatar options...')

  // Alohe avatars (133 total) - color is null
  const aloheAvatars = [
    // vibrent 1-27
    ...Array.from({ length: 27 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_${i + 1}.png`, color: null as string | null })),
    // 3d 1-5
    ...Array.from({ length: 5 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_${i + 1}.png`, color: null })),
    // bluey 1-10
    ...Array.from({ length: 10 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_${i + 1}.png`, color: null })),
    // memo 1-35
    ...Array.from({ length: 35 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_${i + 1}.png`, color: null })),
    // notion 1-15
    ...Array.from({ length: 15 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_${i + 1}.png`, color: null })),
    // teams 1-9
    ...Array.from({ length: 9 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_${i + 1}.png`, color: null })),
    // toon 1-10
    ...Array.from({ length: 10 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_${i + 1}.png`, color: null })),
    // upstream 1-22
    ...Array.from({ length: 22 }, (_, i) => ({ url: `https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_${i + 1}.png`, color: null }))
  ]

  // Color swatches (24 total) - url is null
  const colorSwatches = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#78716c', '#71717a', '#64748b',
    '#1f2937', '#111827', '#506e89', '#f59e0b'
  ].map(color => ({ url: null, color }))

  const all = [...aloheAvatars, ...colorSwatches]
  const created = await prisma.avatarOption.createMany({ data: all })

  console.log(`✅ Seeded ${created.count} avatar options (133 alohe + 24 colors)`)
  await prisma.$disconnect()
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
