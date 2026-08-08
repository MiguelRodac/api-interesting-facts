import pinoHttp from 'pino-http'
import { logger } from './index'

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/ping'
  }
})
