import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import config from '../config'

const hasFirebaseCredentials =
  config.firebase.projectId !== '' &&
  config.firebase.clientEmail !== '' &&
  config.firebase.privateKey !== ''

if (hasFirebaseCredentials && getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey.replace(/\\n/g, '\n')
    })
  })
}

export async function createTestToken (uid: string, email: string): Promise<string> {
  if (!hasFirebaseCredentials) {
    throw new Error('Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars.')
  }
  return await getAuth().createCustomToken(uid, { email })
}
