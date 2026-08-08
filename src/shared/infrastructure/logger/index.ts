import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const createLogger = (): pino.Logger => {
  return pino({
    level: process.env.PINO_LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
    transport: isDev
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
    redact: {
      paths: ['req.headers.authorization', 'req.headers["x-auth-token"]'],
      remove: true
    }
  })
}

export const logger = createLogger()
