import * as Sentry from '@sentry/node'
import app from './app'
import config from './shared/infrastructure/config'
import { logger } from './shared/infrastructure/logger'
import { renderBanner } from './shared/infrastructure/banner'
import { resetIdleTimer, startKeepAlive, stopKeepAlive } from './shared/infrastructure/keepAlive'

// Initialize Sentry before anything else — captures all errors from startup onwards
if (process.env.SENTRY_DSN !== undefined && process.env.SENTRY_DSN !== '') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    serverName: 'api-interesting-facts'
  })
}

// Reset idle timer on every request — ensures the keep-alive cron only fires
// when the API is truly idle (no requests for idleThresholdMs).
app.use((_req, _res, next) => {
  resetIdleTimer()
  next()
})

// Banner shows the npm package version (injected by npm/Vercel at build time)
const resolvedVersion = process.env.npm_package_version ?? 'dev'
console.log(renderBanner(resolvedVersion))

const server = app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`)
  startKeepAlive()
})

// Capture unhandled errors in Sentry
server.on('error', (err: Error) => {
  Sentry.captureException(err)
})

// Graceful shutdown — stop the keep-alive scheduler
const shutdown = (signal: string): void => {
  stopKeepAlive()
  void Sentry.close()
  logger.info({ signal }, 'server shutting down')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
