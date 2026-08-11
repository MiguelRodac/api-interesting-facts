import { Router, type Request, type Response, type NextFunction } from 'express'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { CreateUser } from '../../application/use-cases/CreateUser'
import { GetUserByFirebaseUid } from '../../application/use-cases/GetUserByFirebaseUid'
import { UpdateUser } from '../../application/use-cases/UpdateUser'
import { requireAuth } from '../../../../shared/infrastructure/middleware/auth'
import { requireProfile } from '../../../../shared/infrastructure/middleware/requireProfile'
import { ValidationError } from '../../../../shared/domain/errors/ValidationError'

const router = Router()
const userRepository = new PrismaUserRepository()
const createUser = new CreateUser(userRepository)
const getUserByFirebaseUid = new GetUserByFirebaseUid(userRepository)
const updateUser = new UpdateUser(userRepository)

// POST /auth/dev-login — Login with email/password to get a Firebase ID token (dev/test only)
// Requires a valid DEV_LOGIN_SECRET to prevent unauthorized access
router.post('/dev-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' })
      return
    }

    const { secret, email, password } = req.body

    if (secret == null || typeof secret !== 'string' || secret.trim() === '') {
      throw new ValidationError('secret is required', [{ field: 'secret', message: 'secret is required' }])
    }

    const expectedSecret = process.env.DEV_LOGIN_SECRET
    if (secret.trim() !== expectedSecret) {
      res.status(401).json({ error: 'Invalid secret', code: 'UNAUTHORIZED' })
      return
    }

    if (email == null || typeof email !== 'string' || email.trim() === '') {
      throw new ValidationError('email is required', [{ field: 'email', message: 'email is required' }])
    }

    if (password == null || typeof password !== 'string' || password.trim() === '') {
      throw new ValidationError('password is required', [{ field: 'password', message: 'password is required' }])
    }

    const apiKey = process.env.FIREBASE_API_KEY
    if (apiKey == null || apiKey.trim() === '') {
      throw new Error('FIREBASE_API_KEY is not configured')
    }

    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          returnSecureToken: true
        })
      }
    )

    const data = await firebaseResponse.json()

    if (!firebaseResponse.ok) {
      const errorMsg = data?.error?.message ?? 'Firebase auth failed'
      res.status(401).json({ error: errorMsg, code: 'AUTH_FAILED' })
      return
    }

    res.status(200).json({ token: data.idToken })
  } catch (err) {
    next(err)
  }
})

// POST /auth/profile — Onboarding endpoint (no requireProfile since it creates the user)
router.post('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, displayName, avatarUrl } = req.body

    if (username == null || typeof username !== 'string' || username.trim() === '') {
      throw new ValidationError('Username is required', [{ field: 'username', message: 'Username is required' }])
    }

    if (displayName == null || typeof displayName !== 'string' || displayName.trim() === '') {
      throw new ValidationError('Display name is required', [{ field: 'displayName', message: 'Display name is required' }])
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      throw new ValidationError('Username must be 3-30 characters, alphanumeric and underscores only', [
        { field: 'username', message: 'Username must be 3-30 characters, alphanumeric and underscores only' }
      ])
    }

    const uid = req.user?.uid
    const email = req.user?.email ?? ''

    if (uid == null) {
      throw new ValidationError('Authentication required', [{ field: 'auth', message: 'Authentication required' }])
    }

    const user = await createUser.execute(
      { username: username.trim(), displayName: displayName.trim(), avatarUrl },
      uid,
      email
    )

    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

// GET /auth/me — Get current user profile
router.get('/me', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user?.uid

    if (uid == null) {
      throw new ValidationError('Authentication required', [{ field: 'auth', message: 'Authentication required' }])
    }

    const user = await getUserByFirebaseUid.execute(uid)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})

// PATCH /auth/me — Update current user profile
router.patch('/me', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user?.uid

    if (uid == null) {
      throw new ValidationError('Authentication required', [{ field: 'auth', message: 'Authentication required' }])
    }

    const { displayName, avatarUrl } = req.body

    const user = await updateUser.execute(uid, { displayName, avatarUrl })
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})

export default router
