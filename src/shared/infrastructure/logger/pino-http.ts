/* eslint-disable @typescript-eslint/no-explicit-any */
import pinoHttp from 'pino-http'
import { logger } from './index'

const isDev = process.env.NODE_ENV !== 'production'

const traceIdHeader = process.env.TRACE_ID_HEADER ?? 'x-trace-id'

interface RequestWithHeaders {
  method?: string
  url?: string
  headers: Record<string, string | string[] | undefined>
}

const getTraceId = (req: RequestWithHeaders): string => {
  const headerValue = req.headers[traceIdHeader]
  if (typeof headerValue === 'string' && headerValue.length > 0) {
    return headerValue
  }
  if (Array.isArray(headerValue) && headerValue.length > 0 && typeof headerValue[0] === 'string') {
    return headerValue[0]
  }
  return `gen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const redactHeaders = ['authorization', 'x-auth-token', 'cookie', 'set-cookie']

interface SerializedRequest {
  method: string
  url: string
  query: Record<string, string>
  headers: Record<string, string>
}

interface SerializedResponse {
  statusCode: number
  headers: Record<string, string>
}

const serializeRequest = (req: SerializedRequest): SerializedRequest => {
  const redacted: SerializedRequest = {
    method: req.method,
    url: req.url,
    query: req.query ?? {},
    headers: {}
  }
  if (req.headers !== undefined) {
    for (const [key, value] of Object.entries(req.headers)) {
      if (redactHeaders.some((h) => key.toLowerCase().includes(h))) {
        redacted.headers[key] = '[REDACTED]'
      } else {
        redacted.headers[key] = value
      }
    }
  }
  return redacted
}

const serializeResponse = (res: SerializedResponse): SerializedResponse => {
  const redacted: SerializedResponse = {
    statusCode: res.statusCode,
    headers: {}
  }
  if (res.headers !== undefined) {
    for (const [key, value] of Object.entries(res.headers)) {
      if (redactHeaders.some((h) => key.toLowerCase().includes(h))) {
        redacted.headers[key] = '[REDACTED]'
      } else {
        redacted.headers[key] = value
      }
    }
  }
  return redacted
}

const getLogMessage = (req: RequestWithHeaders, res: { statusCode?: number, responseTime: number }, _traceId: string): string => {
  const responseTime = res.responseTime
  if (isDev) {
    const method = req.method ?? 'UNKNOWN'
    const url = req.url ?? 'UNKNOWN'
    const status = res.statusCode ?? 500
    return `${method} ${url} ${status} ${responseTime}ms`
  }
  return 'request completed'
}

const pinoHttpOptions: any = {
  logger,
  autoLogging: {
    ignore: (req: any) => req.url === '/ping'
  },
  customReceivedMessage: () => '',
  customSuccessMessage: (req: any, res: any, responseTime: any): string => {
    const reqWithHeaders: RequestWithHeaders = { method: req.method, url: req.url, headers: req.headers }
    const traceId = getTraceId(reqWithHeaders)
    return getLogMessage(reqWithHeaders, { statusCode: res.statusCode, responseTime }, traceId)
  },
  customErrorMessage: (req: any, res: any, _error: any, responseTime: any): string => {
    const reqWithHeaders: RequestWithHeaders = { method: req.method, url: req.url, headers: req.headers }
    const traceId = getTraceId(reqWithHeaders)
    const statusCode = res.statusCode ?? 500
    return getLogMessage(reqWithHeaders, { statusCode, responseTime }, traceId)
  },
  serializers: {
    req: serializeRequest as (req: unknown) => SerializedRequest,
    res: serializeResponse as (res: unknown) => SerializedResponse
  },
  customProps: (req: any) => {
    const reqWithHeaders: RequestWithHeaders = { method: req.method, url: req.url, headers: req.headers }
    return { traceId: getTraceId(reqWithHeaders) }
  }
}

if (isDev) {
  pinoHttpOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname,req,res',
      customColors: 'err:red,warn:yellow,info:green,debug:blue'
    }
  }
}

export const httpLogger = pinoHttp(pinoHttpOptions)
