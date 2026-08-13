import app from './app'
import config from './shared/infrastructure/config'
import { logger } from './shared/infrastructure/logger'
import { banner } from './shared/infrastructure/banner'
import { resetIdleTimer, startKeepAlive, stopKeepAlive } from './shared/infrastructure/keepAlive'

// Reset idle timer on every request — ensures the keep-alive cron only fires
// when the API is truly idle (no requests for idleThresholdMs).
app.use((_req, _res, next) => {
  resetIdleTimer()
  next()
})

console.log(banner)

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`)
  startKeepAlive()
})

// Graceful shutdown — stop the keep-alive scheduler
const shutdown = (signal: string): void => {
  stopKeepAlive()
  logger.info({ signal }, 'server shutting down')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
