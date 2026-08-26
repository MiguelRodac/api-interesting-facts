import { type Request, type Response, type NextFunction } from 'express'
import { compareVersions } from '@shared/domain/utils/compareVersions'
import { logger } from '../logger'

const MIN_APP_VERSION = process.env.MIN_APP_VERSION ?? '1.0.0'
const STRICT_VERSION_CHECK = process.env.STRICT_VERSION_CHECK === 'true'

/**
 * Middleware that checks the X-App-Version header against MIN_APP_VERSION.
 * If the client version is older, responds with 426 Upgrade Required.
 *
 * Behavior:
 * - STRICT_VERSION_CHECK=true: rejects requests missing X-App-Version header (400)
 * - STRICT_VERSION_CHECK=false (default): skips check when header is missing
 */
export function versionCheck (req: Request, res: Response, next: NextFunction): void {
  const clientVersion = req.headers['x-app-version']

  if (clientVersion == null || typeof clientVersion !== 'string') {
    if (STRICT_VERSION_CHECK) {
      logger.warn(
        { path: req.path },
        'Missing X-App-Version header — blocking request (strict mode)'
      )

      res.status(400).json({
        type: `${process.env.BASE_URL ?? 'http://localhost:3000'}/errors/version/missing-header`,
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
      type: `${process.env.BASE_URL ?? 'http://localhost:3000'}/errors/version/upgrade-required`,
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
