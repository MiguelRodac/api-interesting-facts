import app from './app'
import config from './shared/infrastructure/config'
import { logger } from './shared/infrastructure/logger'

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`)
})
