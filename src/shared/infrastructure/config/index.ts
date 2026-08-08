import dotenv from 'dotenv'
dotenv.config()

const portStr = process.env.PORT
const port = portStr !== undefined && portStr !== '' ? Number(portStr) : 3001

const config = {
  port: isNaN(port) ? 3001 : port,
  database: {
    url: process.env.DATABASE_URL ?? ''
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',
    apiKey: process.env.FIREBASE_API_KEY ?? ''
  }
}

export default config
