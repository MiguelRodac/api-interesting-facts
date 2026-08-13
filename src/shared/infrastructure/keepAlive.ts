/**
 * Keep-alive cron for external databases (e.g. Render Postgres).
 *
 * Fires a lightweight DB query only when the API has been idle (no incoming
 * requests) for longer than `idleThresholdMs`.  As soon as a request arrives,
 * the idle timer resets — no query is wasted while the API is under load.
 */

import prisma from '@shared/infrastructure/prisma'
import { logger } from './logger'
import config from './config'

const IDLE_THRESHOLD = config.keepAlive.idleThresholdMs

let lastRequestTime = Date.now()
let intervalHandle: ReturnType<typeof setInterval> | null = null

/**
 * Call this from the HTTP middleware on every incoming request to reset the
 * idle timer.
 */
export function resetIdleTimer (): void {
  lastRequestTime = Date.now()
}

/**
 * Ping the database with a trivial query to keep the connection alive.
 */
async function pingDatabase (): Promise<void> {
  try {
    await prisma.$queryRaw<[{ now: Date }]>`
      SELECT NOW() AS now
    `
    logger.info({ idleMs: Date.now() - lastRequestTime }, 'keep-alive ping sent to database')
  } catch (err) {
    logger.warn({ err }, 'keep-alive ping failed — database may be sleeping or unreachable')
  }
}

function tick (): void {
  const elapsed = Date.now() - lastRequestTime
  if (elapsed >= IDLE_THRESHOLD) {
    void pingDatabase()
    // Reset so we don't ping again until the next idle period
    lastRequestTime = Date.now()
  }
}

/**
 * Start the keep-alive scheduler.  Idempotent — safe to call multiple times.
 */
export function startKeepAlive (): void {
  if (intervalHandle !== null) return

  intervalHandle = setInterval(tick, IDLE_THRESHOLD / 3)
  // Divide by 3 so we check 3 times per idle window — fast enough to catch
  // idle state without overhead (e.g. 20 min threshold → check every ~6-7 min).
  logger.info(
    { idleThresholdMs: IDLE_THRESHOLD, checkIntervalMs: Math.round(IDLE_THRESHOLD / 3) },
    'keep-alive scheduler started'
  )
}

/**
 * Stop the scheduler (useful for graceful shutdown).
 */
export function stopKeepAlive (): void {
  if (intervalHandle === null) return
  clearInterval(intervalHandle)
  intervalHandle = null
  logger.info('keep-alive scheduler stopped')
}
