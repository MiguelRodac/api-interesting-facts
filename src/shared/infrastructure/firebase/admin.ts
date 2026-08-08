import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import config from '../config'

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey.replace(/\\n/g, '\n')
    })
  })
}

export async function createTestToken (uid: string, email: string): Promise<string> {
  return await getAuth().createCustomToken(uid, { email })
}
