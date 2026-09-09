import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { GetUserByUsername } from '../../application/use-cases/GetUserByUsername'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { optionalAuth } from '@shared/infrastructure/middleware/optionalAuth'
import { PrismaAvatarOptionRepository } from '@avatar/infrastructure/repositories/PrismaAvatarOptionRepository'
import { ValidationError } from '@shared/domain/errors/ValidationError'
import { USERNAME_PATTERN } from '@shared/domain/validation'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaFactRepository } from '@fact/infrastructure/repositories/PrismaFactRepository'
import { PrismaLikeRepository } from '@likes/infrastructure/repositories/PrismaLikeRepository'
import { PrismaCommentRepository } from '@comments/infrastructure/repositories/PrismaCommentRepository'
import { GetMentionsByUser } from '@mentions/application/use-cases/GetMentionsByUser'

const router = Router()
const userRepository = new PrismaUserRepository()
const avatarOptionRepository = new PrismaAvatarOptionRepository()
const getUserByUsername = new GetUserByUsername(userRepository)
const factRepository = new PrismaFactRepository()
const likeRepository = new PrismaLikeRepository()
const commentRepository = new PrismaCommentRepository()
const getMentionsByUser = new GetMentionsByUser(
  factRepository,
  likeRepository,
  commentRepository
)

const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter q is required'),
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(50).default(DEFAULT_LIMIT)
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

// GET /users/search?q={query}&page={page}&limit={limit} — Search users for @mention autocomplete (auth required)
router.get('/search', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SearchQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ValidationError('q parameter is required', [{ field: 'q', message: 'Query parameter q is required' }])
    }

    const { q, page, limit } = parsed.data
    const skip = (page - 1) * limit
    const fetchLimit = limit + 1

    const { results: users } = await userRepository.findBySearch(q, {
      skip,
      limit: fetchLimit,
      order_by: 'popular',
      order_dir: 'desc'
    })

    const hasMore = users.length > limit
    const pageResults = users.slice(0, limit)

    const response = pageResults.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor
    }))

    res.status(200).json({
      results: response,
      page,
      limit,
      hasMore
    })
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

// GET /users/:username/mentions — Paginated mention list for a user (public, optional auth for viewer context)
router.get('/:username/mentions', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username as string
    const viewerId = req.user?.uid

    if (!USERNAME_PATTERN.test(username)) {
      throw new ValidationError('Username must be 3-30 characters and only contain letters, numbers, underscores or dots', [
        { field: 'username', message: 'Username must be 3-30 characters and only contain letters, numbers, underscores or dots' }
      ])
    }

    const { page, limit } = MentionsQuerySchema.parse(req.query)
    const user = await getUserByUsername.execute(username)
    const result = await getMentionsByUser.execute(user.id, user.username, { page, limit }, viewerId)
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
