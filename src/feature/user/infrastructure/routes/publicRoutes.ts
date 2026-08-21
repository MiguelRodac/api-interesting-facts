import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { GetUserByUsername } from '../../application/use-cases/GetUserByUsername'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { PrismaAvatarOptionRepository } from '@avatar/infrastructure/repositories/PrismaAvatarOptionRepository'
import { ValidationError } from '@shared/domain/errors/ValidationError'
import { USERNAME_PATTERN } from '@shared/domain/validation'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaMentionRepository } from '@mentions/infrastructure/repositories/PrismaMentionRepository'
import { GetMentionsByUser } from '@mentions/application/use-cases/GetMentionsByUser'

const router = Router()
const userRepository = new PrismaUserRepository()
const avatarOptionRepository = new PrismaAvatarOptionRepository()
const getUserByUsername = new GetUserByUsername(userRepository)
const mentionRepository = new PrismaMentionRepository()
const getMentionsByUser = new GetMentionsByUser(mentionRepository)

const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter q is required')
}).strict()

const CheckUsernameQuerySchema = z.object({
  username: z
    .string()
    .min(1, 'username parameter is required')
    .regex(USERNAME_PATTERN, 'Username must be 3-30 characters and only contain letters, numbers, underscores or dots')
}).strict()

const MentionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT)
})

// GET /users/search?q={query} — Search users for @mention autocomplete (auth required)
router.get('/search', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SearchQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ValidationError('q parameter is required', [{ field: 'q', message: 'Query parameter q is required' }])
    }

    const { q } = parsed.data
    const users = await userRepository.findBySearch(q)

    const response = users.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor
    }))

    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
})

// GET /users/check-username?username={username} — Check username availability (public, rate-limited)
router.get('/check-username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CheckUsernameQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ValidationError('username parameter is required', [{ field: 'username', message: 'username parameter is required' }])
    }

    const { username } = parsed.data
    const exists = await userRepository.existsByUsername(username)

    res.status(200).json({ available: !exists })
  } catch (err) {
    next(err)
  }
})

// GET /users/avatar-options — Get all preset avatar options (public)
router.get('/avatar-options', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const options = await avatarOptionRepository.findAll()
    res.status(200).json(options)
  } catch (err) {
    next(err)
  }
})

// GET /users/:username/mentions — Paginated mention list for a user (public)
router.get('/:username/mentions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username as string

    if (!USERNAME_PATTERN.test(username)) {
      throw new ValidationError('Username must be 3-30 characters and only contain letters, numbers, underscores or dots', [
        { field: 'username', message: 'Username must be 3-30 characters and only contain letters, numbers, underscores or dots' }
      ])
    }

    const { page, limit } = MentionsQuerySchema.parse(req.query)
    const user = await getUserByUsername.execute(username)
    const result = await getMentionsByUser.execute(user.id, { page, limit })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

// GET /users/:username — Get public profile by username
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username as string

    if (!USERNAME_PATTERN.test(username)) {
      throw new ValidationError('Username must be 3-30 characters and only contain letters, numbers, underscores or dots', [
        { field: 'username', message: 'Username must be 3-30 characters and only contain letters, numbers, underscores or dots' }
      ])
    }

    const user = await getUserByUsername.execute(username)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})

export default router
