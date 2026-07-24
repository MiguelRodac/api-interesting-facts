import { initializeApp, getApps, cert } from 'firebase-admin/app'
import config from '../../config'

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey.replace(/\\n/g, '\n')
    })
  })
}
