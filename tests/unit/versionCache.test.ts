import { versionCache } from '@shared/infrastructure/cache/versionCache'
import prisma from '@shared/infrastructure/prisma'

describe('VersionCacheService', () => {
  const originalEnvVersion = process.env.MIN_APP_VERSION

  beforeEach(() => {
    process.env.MIN_APP_VERSION = '1.0.0'
  })

  afterAll(() => {
    process.env.MIN_APP_VERSION = originalEnvVersion
  })

  it('should fall back to process.env.MIN_APP_VERSION when database is empty', async () => {
    jest.spyOn(prisma.appVersion, 'findMany').mockResolvedValueOnce([])

    const status = await versionCache.refreshCache()
    expect(status.source).toBe('env_fallback')
    expect(status.ttlHours).toBe(12)
    expect(status.versions).toHaveLength(1)
    expect(status.versions[0].platform).toBe('all')
    expect(status.versions[0].minVersion).toBe('1.0.0')

    expect(versionCache.getMinVersion()).toBe('1.0.0')
    expect(versionCache.getMinVersion('android')).toBe('1.0.0')
    expect(versionCache.getMinVersion('ios')).toBe('1.0.0')
  })

  it('should populate cache from database when records exist', async () => {
    const mockDbRecords = [
      {
        id: '1',
        platform: 'all',
        minVersion: '1.0.0',
        recommendedVersion: '1.1.0',
        forceUpdate: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        platform: 'android',
        minVersion: '1.2.0',
        recommendedVersion: '1.3.0',
        forceUpdate: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        platform: 'ios',
        minVersion: '1.1.5',
        recommendedVersion: '1.2.0',
        forceUpdate: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    jest.spyOn(prisma.appVersion, 'findMany').mockResolvedValueOnce(mockDbRecords)

    const status = await versionCache.refreshCache()
    expect(status.source).toBe('database')
    expect(status.versions).toHaveLength(3)

    expect(versionCache.getMinVersion('android')).toBe('1.2.0')
    expect(versionCache.getMinVersion('ios')).toBe('1.1.5')
    expect(versionCache.getMinVersion('web')).toBe('1.0.0')
    expect(versionCache.getMinVersion()).toBe('1.0.0')
  })

  it('should gracefully handle database errors and fallback to .env', async () => {
    jest.spyOn(prisma.appVersion, 'findMany').mockRejectedValueOnce(new Error('DB Connection Lost'))

    const status = await versionCache.refreshCache()
    expect(status.source).toBe('env_fallback')
    expect(status.versions[0].minVersion).toBe('1.0.0')
    expect(versionCache.getMinVersion('android')).toBe('1.0.0')
  })

  it('should return valid diagnostic cache status', async () => {
    jest.spyOn(prisma.appVersion, 'findMany').mockResolvedValueOnce([])
    await versionCache.refreshCache()

    const status = versionCache.getCacheStatus()
    expect(status.lastFetchedAt).not.toBeNull()
    expect(status.nextRefreshAt).not.toBeNull()
    expect(status.ttlHours).toBe(12)
    expect(status.source).toBe('env_fallback')
  })
})
