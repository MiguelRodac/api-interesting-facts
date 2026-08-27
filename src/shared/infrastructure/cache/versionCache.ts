import { prisma } from '../prisma'
import { logger } from '../logger'

export interface AppVersionRecord {
  id?: string
  platform: string
  minVersion: string
  recommendedVersion?: string | null
  forceUpdate: boolean
  isActive: boolean
  updatedAt?: Date
}

export interface CacheStatus {
  lastFetchedAt: string | null
  nextRefreshAt: string | null
  ttlHours: number
  source: 'database' | 'env_fallback'
  versions: AppVersionRecord[]
}

const TTL_HOURS = 12
const TTL_MS = TTL_HOURS * 60 * 60 * 1000

class VersionCacheService {
  private readonly cache = new Map<string, AppVersionRecord>()
  private lastFetchedAt: Date | null = null
  private source: 'database' | 'env_fallback' = 'env_fallback'
  private refreshTimer: NodeJS.Timeout | null = null

  /**
   * Initializes the cache on app startup and starts the 12-hour background refresh loop.
   */
  async init (): Promise<void> {
    await this.refreshCache()

    if (this.refreshTimer == null) {
      this.refreshTimer = setInterval(() => {
        this.refreshCache().catch((err: unknown) => {
          logger.error({ err }, 'Background version cache refresh failed')
        })
      }, TTL_MS)

      // Prevent the timer from keeping Node process alive if everything else exits
      if (this.refreshTimer.unref != null) {
        this.refreshTimer.unref()
      }
    }
  }

  /**
   * Refreshes the in-memory cache directly from the database with .env fallback.
   */
  async refreshCache (): Promise<CacheStatus> {
    const envFallback = process.env.MIN_APP_VERSION ?? '0.0.1'

    try {
      const records = await prisma.appVersion.findMany({
        where: { isActive: true }
      })

      if (records.length > 0) {
        this.cache.clear()
        for (const record of records) {
          this.cache.set(record.platform.toLowerCase(), {
            id: record.id,
            platform: record.platform,
            minVersion: record.minVersion,
            recommendedVersion: record.recommendedVersion,
            forceUpdate: record.forceUpdate,
            isActive: record.isActive,
            updatedAt: record.updatedAt
          })
        }
        this.source = 'database'
        this.lastFetchedAt = new Date()

        logger.info(
          { count: records.length, platforms: Array.from(this.cache.keys()) },
          'App version cache refreshed from database'
        )
      } else {
        // Table is empty -> Fallback to .env
        this.setFallback(envFallback)
        logger.warn(
          { fallbackVersion: envFallback },
          'app_versions table is empty — using MIN_APP_VERSION from .env as fallback'
        )
      }
    } catch (err) {
      this.setFallback(envFallback)
      logger.error(
        { err, fallbackVersion: envFallback },
        'Failed to load app_versions from database — falling back to .env'
      )
    }

    return this.getCacheStatus()
  }

  private setFallback (minVersion: string): void {
    this.cache.clear()
    this.cache.set('all', {
      platform: 'all',
      minVersion,
      recommendedVersion: minVersion,
      forceUpdate: true,
      isActive: true,
      updatedAt: new Date()
    })
    this.source = 'env_fallback'
    this.lastFetchedAt = new Date()
  }

  /**
   * Returns the minimum allowed version for the requested platform (or 'all').
   */
  getMinVersion (platform?: string): string {
    const defaultMin = process.env.MIN_APP_VERSION ?? '0.0.1'

    if (this.cache.size === 0) {
      return defaultMin
    }

    if (platform != null && platform.trim() !== '') {
      const normalized = platform.toLowerCase().trim()
      const platformRecord = this.cache.get(normalized)
      if (platformRecord != null) {
        return platformRecord.minVersion
      }
    }

    const allRecord = this.cache.get('all')
    if (allRecord != null) {
      return allRecord.minVersion
    }

    return defaultMin
  }

  /**
   * Returns current cache diagnostics.
   */
  getCacheStatus (): CacheStatus {
    const nextRefresh = this.lastFetchedAt != null
      ? new Date(this.lastFetchedAt.getTime() + TTL_MS).toISOString()
      : null

    return {
      lastFetchedAt: this.lastFetchedAt?.toISOString() ?? null,
      nextRefreshAt: nextRefresh,
      ttlHours: TTL_HOURS,
      source: this.source,
      versions: Array.from(this.cache.values())
    }
  }
}

export const versionCache = new VersionCacheService()
