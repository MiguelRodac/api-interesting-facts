import { type Request, type Response, type NextFunction } from 'express'
import { compareVersions } from '@shared/domain/utils/compareVersions'
import { logger } from '../logger'

const MIN_APP_VERSION = process.env.MIN_APP_VERSION ?? '1.0.0'

/**
 * Middleware that checks the X-App-Version header against MIN_APP_VERSION.
 * If the client version is older, responds with 426 Upgrade Required.
 *
 * Skipped when:
 * - MIN_APP_VERSION is not set (defaults to 1.0.0)
 * - X-App-Version header is missing (let other middleware/auth handle it)
 */
export function versionCheck (req: Request, res: Response, next: NextFunction): void {
  const clientVersion = req.headers['x-app-version']

  if (clientVersion == null || typeof clientVersion !== 'string') {
    // No version header — skip check (auth middleware will handle if needed)
    next()
    return
  }

  if (compareVersions(clientVersion, MIN_APP_VERSION) === -1) {
    logger.warn(
      { clientVersion, minVersion: MIN_APP_VERSION, path: req.path },
      'App version too old — blocking request'
    )

    res.status(426).json({
      type: `${process.env.BASE_URL ?? 'http://localhost:3000'}/errors/version/upgrade-required`,
      title: 'Upgrade Required',
      status: 426,
      detail: `This version (${clientVersion}) is no longer supported. Please update to version ${MIN_APP_VERSION} or later.`,
      error_code: 'APP_VERSION_OUTDATED',
      category: 'version',
      instance: req.originalUrl,
      trace_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      min_version: MIN_APP_VERSION
    })
    return
  }

  next()
}
