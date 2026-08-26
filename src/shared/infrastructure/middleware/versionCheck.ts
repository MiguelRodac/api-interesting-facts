import { type Request, type Response, type NextFunction } from 'express'
import { compareVersions } from '@shared/domain/utils/compareVersions'
import { logger } from '../logger'

// Validated at startup by shared/infrastructure/config — guaranteed present
const MIN_APP_VERSION = process.env.MIN_APP_VERSION as string

/**
 * Strict by default: requests missing X-App-Version are rejected with 400.
 * Set STRICT_VERSION_CHECK=false only for local debugging / e2e tests.
 */
function isStrict (): boolean {
  return process.env.STRICT_VERSION_CHECK !== 'false'
}

/**
 * Browser-facing routes that don't require X-App-Version:
 * - /ping        → health checks (UptimeRobot) and status page
 * - /api/docs    → Scalar docs UI (opened directly in a browser)
 * - /favicon.svg → favicon served for the docs/ping pages
 */
const EXEMPT_PATHS = new Set(['/ping', '/favicon.svg'])

function isExempt (path: string): boolean {
  if (EXEMPT_PATHS.has(path)) return true
  return path === '/api/docs' || path.startsWith('/api/docs/')
}

/**
 * Middleware that checks the X-App-Version header against MIN_APP_VERSION on
 * EVERY endpoint. Applied globally via app.use() before all routes.
 *
 * Behavior:
 * - Missing X-App-Version header → 400 APP_VERSION_MISSING (unless strict mode disabled)
 * - Version older than MIN_APP_VERSION → 426 APP_VERSION_OUTDATED
 * - Exempt: /ping, /api/docs, /favicon.svg (accessed directly from a browser)
 *
 * Error bodies never disclose the minimum supported version.
 */
export function versionCheck (req: Request, res: Response, next: NextFunction): void {
  if (isExempt(req.path)) {
    next()
    return
  }

  const clientVersion = req.headers['x-app-version']

  if (clientVersion == null || typeof clientVersion !== 'string') {
    if (isStrict()) {
      logger.warn(
        { path: req.path },
        'Missing X-App-Version header — blocking request'
      )

      res.status(400).json({
        type: `${process.env.BASE_URL as string}/errors/version/missing-header`,
        title: 'Missing Version Header',
        status: 400,
        detail: 'App version not valid. Please update your client.',
        error_code: 'APP_VERSION_MISSING',
        category: 'version',
        instance: req.originalUrl,
        trace_id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      })
      return
    }
    next()
    return
  }

  if (compareVersions(clientVersion, MIN_APP_VERSION) === -1) {
    logger.warn(
      { clientVersion, minVersion: MIN_APP_VERSION, path: req.path },
      'App version too old — blocking request'
    )

    res.status(426).json({
      type: `${process.env.BASE_URL as string}/errors/version/upgrade-required`,
      title: 'Upgrade Required',
      status: 426,
      detail: 'App version not supported. Please update your client to the latest version.',
      error_code: 'APP_VERSION_OUTDATED',
      category: 'version',
      instance: req.originalUrl,
      trace_id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    })
    return
  }

  next()
}
