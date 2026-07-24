import app from './app'
import config from './shared/config'
import { logger } from './shared/logger'

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`)
})
