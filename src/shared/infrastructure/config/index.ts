import dotenv from 'dotenv'
dotenv.config()

// Every functional environment variable MUST be declared here.
// Missing or empty values abort startup — the API never runs on implicit defaults.
const REQUIRED: string[] = [
  'DATABASE_URL',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_API_KEY',
  'PORT',
  'NODE_ENV',
  'PINO_LOG_LEVEL',
  'TRACE_ID_HEADER',
  'CORS_ORIGIN',
  'BASE_URL',
  'MIN_APP_VERSION',
  'STRICT_VERSION_CHECK',
  'RATE_LIMIT_MAX',
  'RATE_LIMIT_WINDOW_MS',
  'AUTOCOMPLETE_RATE_LIMIT',
  'KEEP_ALIVE_IDLE_THRESHOLD_MS',
  'ADMIN_API_KEY'
]

// OPTIONAL (intentionally not validated): SENTRY_DSN — when empty or absent, Sentry stays disabled.

const missing: string[] = []
for (const key of REQUIRED) {
  const val = process.env[key]
  if (val == null || val.trim() === '') {
    missing.push(key)
  }
}
if (missing.length > 0) {
  console.error('[config] Missing required environment variables:')
  for (const label of missing) {
    console.error(`  - ${label}`)
  }
  console.error('[config] App will not start.')
  process.exit(1)
}

const config = {
  port: Number(process.env.PORT),
  database: {
    url: process.env.DATABASE_URL as string
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY as string,
    apiKey: process.env.FIREBASE_API_KEY as string
  },
  logging: {
    traceIdHeader: process.env.TRACE_ID_HEADER as string
  },
  keepAlive: {
    // Fire a DB ping after this many ms of idle (protects external DBs that sleep, e.g. Render free tier)
    idleThresholdMs: Number(process.env.KEEP_ALIVE_IDLE_THRESHOLD_MS)
  },
  minAppVersion: process.env.MIN_APP_VERSION as string
}

export default config
