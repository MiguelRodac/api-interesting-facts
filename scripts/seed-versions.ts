import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

interface SeedVersionItem {
  platform: string
  minVersion: string
  recommendedVersion?: string
  forceUpdate?: boolean
  isActive?: boolean
}

const defaultVersions: SeedVersionItem[] = [
  {
    platform: 'all',
    minVersion: '0.0.5',
    recommendedVersion: '0.0.5',
    forceUpdate: true,
    isActive: true
  },
  {
    platform: 'android',
    minVersion: '0.0.5',
    recommendedVersion: '0.0.5',
    forceUpdate: true,
    isActive: true
  },
  {
    platform: 'web',
    minVersion: '0.0.5',
    recommendedVersion: '0.0.5',
    forceUpdate: true,
    isActive: true
  },
  {
    platform: 'ios',
    minVersion: '0.0.5',
    recommendedVersion: '0.0.5',
    forceUpdate: true,
    isActive: true
  }
]

async function seed (): Promise<void> {
  console.log('🌱 Upserting app_versions in database...')

  for (const item of defaultVersions) {
    const record = await prisma.appVersion.upsert({
      where: { platform: item.platform },
      update: {
        minVersion: item.minVersion,
        recommendedVersion: item.recommendedVersion ?? item.minVersion,
        forceUpdate: item.forceUpdate ?? true,
        isActive: item.isActive ?? true
      },
      create: {
        platform: item.platform,
        minVersion: item.minVersion,
        recommendedVersion: item.recommendedVersion ?? item.minVersion,
        forceUpdate: item.forceUpdate ?? true,
        isActive: item.isActive ?? true
      }
    })
    console.log(`  ✓ [${record.platform}] min: v${record.minVersion} | recommended: v${record.recommendedVersion ?? record.minVersion} | active: ${String(record.isActive)}`)
  }

  console.log('\n✅ All app_versions successfully configured in PostgreSQL!')
  await prisma.$disconnect()
  process.exit(0)
}

seed().catch(e => {
  console.error('❌ Error configuring app_versions:', e)
  process.exit(1)
})
