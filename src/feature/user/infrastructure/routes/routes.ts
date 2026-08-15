import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { CreateUser } from '../../application/use-cases/CreateUser'
import { GetUserByFirebaseUid } from '../../application/use-cases/GetUserByFirebaseUid'
import { UpdateUser } from '../../application/use-cases/UpdateUser'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { requireProfile } from '@shared/infrastructure/middleware/requireProfile'
import { ValidationError } from '@shared/domain/errors/ValidationError'
import { USERNAME_PATTERN } from '@shared/domain/validation'

const MentionQuerySchema = z.object({
  q: z.string().min(1, 'q is required').max(50),
  limit: z.coerce.number().int().positive().max(20).default(10)
}).strict()

const router = Router()
const userRepository = new PrismaUserRepository()
const createUser = new CreateUser(userRepository)
const getUserByFirebaseUid = new GetUserByFirebaseUid(userRepository)
const updateUser = new UpdateUser(userRepository)

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

    if (!USERNAME_PATTERN.test(username)) {
      throw new ValidationError('Username must be 3-30 characters and only contain letters, numbers, underscores or dots', [
        { field: 'username', message: 'Username must be 3-30 characters and only contain letters, numbers, underscores or dots' }
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

    const { displayName, avatarUrl, avatarColor, email } = req.body

    const user = await updateUser.execute(uid, { displayName, avatarUrl, avatarColor, email })
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})

// GET /users?q= — Mention autocomplete for composing facts
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = MentionQuerySchema.parse(req.query)
    const users = await userRepository.findBySearch(q.trim(), { order_by: 'popular', order_dir: 'desc', limit })
    res.status(200).json({
      results: users.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor
      }))
    })
  } catch (err) {
    next(err)
  }
})

export default router
