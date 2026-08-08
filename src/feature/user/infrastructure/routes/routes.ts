import { Router, type Request, type Response, type NextFunction } from 'express'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { CreateUser } from '../../application/use-cases/CreateUser'
import { GetUserByFirebaseUid } from '../../application/use-cases/GetUserByFirebaseUid'
import { requireAuth } from '../../../../shared/infrastructure/middleware/auth'
import { ValidationError } from '../../../../shared/domain/errors/ValidationError'

const router = Router()
const userRepository = new PrismaUserRepository()
const createUser = new CreateUser(userRepository)
const getUserByFirebaseUid = new GetUserByFirebaseUid(userRepository)

// POST /auth/profile — Onboarding endpoint (no requireProfile since it creates the user)
router.post('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, displayName, avatarUrl } = req.body

    // Validate required fields
    if (username == null || typeof username !== 'string' || username.trim() === '') {
      throw new ValidationError('Username is required', { username: 'Username is required' })
    }

    if (displayName == null || typeof displayName !== 'string' || displayName.trim() === '') {
      throw new ValidationError('Display name is required', { displayName: 'Display name is required' })
    }

    // Validate username format (alphanumeric + underscores, 3-30 chars)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      throw new ValidationError('Username must be 3-30 characters, alphanumeric and underscores only', {
        username: 'Username must be 3-30 characters, alphanumeric and underscores only'
      })
    }

    const uid = req.user?.uid
    const email = req.user?.email ?? ''

    if (uid == null) {
      throw new ValidationError('Authentication required', { auth: 'Authentication required' })
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
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user?.uid

    if (uid == null) {
      throw new ValidationError('Authentication required', { auth: 'Authentication required' })
    }

    const user = await getUserByFirebaseUid.execute(uid)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})

export default router
