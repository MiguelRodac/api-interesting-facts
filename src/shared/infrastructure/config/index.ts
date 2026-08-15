import dotenv from 'dotenv'
dotenv.config()

const REQUIRED: Array<{ key: string; label: string }> = [
  { key: 'DATABASE_URL', label: 'DATABASE_URL' },
  { key: 'FIREBASE_PROJECT_ID', label: 'FIREBASE_PROJECT_ID' },
  { key: 'FIREBASE_CLIENT_EMAIL', label: 'FIREBASE_CLIENT_EMAIL' },
  { key: 'FIREBASE_PRIVATE_KEY', label: 'FIREBASE_PRIVATE_KEY' },
  { key: 'FIREBASE_API_KEY', label: 'FIREBASE_API_KEY' },
  { key: 'PORT', label: 'PORT' },
  { key: 'NODE_ENV', label: 'NODE_ENV' },
  { key: 'PINO_LOG_LEVEL', label: 'PINO_LOG_LEVEL' },
  { key: 'DOTENV_TIPS', label: 'DOTENV_TIPS' },
  { key: 'TRACE_ID_HEADER', label: 'TRACE_ID_HEADER' },
  { key: 'CORS_ORIGIN', label: 'CORS_ORIGIN' },
  { key: 'KEEP_ALIVE_IDLE_THRESHOLD_MS', label: 'KEEP_ALIVE_IDLE_THRESHOLD_MS' },
  { key: 'AUTOCOMPLETE_RATE_LIMIT', label: 'AUTOCOMPLETE_RATE_LIMIT' }
]

const missing: string[] = []
for (const { key, label } of REQUIRED) {
  const val = process.env[key]
  if (val == null || val.trim() === '') {
    missing.push(label)
  }
}
if (missing.length > 0) {
  console.error(`[config] Missing required environment variables:`)
  for (const label of missing) {
    console.error(`  - ${label}`)
  }
  console.error(`[config] App will not start.`)
  process.exit(1)
}

const portStr = process.env.PORT
const port = portStr !== undefined && portStr !== '' ? Number(portStr) : 3000

const config = {
  port: isNaN(port) ? 3000 : port,
  database: {
    url: process.env.DATABASE_URL ?? ''
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',
    apiKey: process.env.FIREBASE_API_KEY ?? ''
  },
  logging: {
    traceIdHeader: process.env.TRACE_ID_HEADER ?? 'x-trace-id'
  },
  keepAlive: {
    // Fire a DB ping after this many ms of idle (default 20 min — Render free tier sleeps after 30 min)
    idleThresholdMs: Number(process.env.KEEP_ALIVE_IDLE_THRESHOLD_MS ?? '1200000')
  }
}

export default config
