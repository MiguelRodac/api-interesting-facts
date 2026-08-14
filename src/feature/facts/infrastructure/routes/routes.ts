import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaFactRepository } from '../repositories/PrismaFactRepository'
import { PrismaUserRepository } from '@user/infrastructure/repositories/PrismaUserRepository'
import { PrismaHashtagRepository } from '@hashtag/infrastructure/repositories/PrismaHashtagRepository'
import { CreateFact } from '../../application/use-cases/CreateFact'
import { GetFactById } from '../../application/use-cases/GetFactById'
import { UpdateFact } from '../../application/use-cases/UpdateFact'
import { DeleteFact } from '../../application/use-cases/DeleteFact'
import { GetFacts } from '../../application/use-cases/GetFacts'
import { GetFactsByAuthor } from '../../application/use-cases/GetFactsByAuthor'
import { GetPopularFacts } from '../../application/use-cases/GetPopularFacts'
import { SearchPosts } from '../../application/use-cases/SearchPosts'
import { SearchHashtags } from '@hashtag/application/use-cases/SearchHashtags'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { optionalAuth } from '@shared/infrastructure/middleware/optionalAuth'
import { requireProfile } from '@shared/infrastructure/middleware/requireProfile'

// order_by: solo campos válidos de Prisma. likesCount es campo calculado y solo se permite en listados.
const baseOrderBySchema = z.enum(['createdAt', 'updatedAt'])
const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT),
  order_by: baseOrderBySchema.optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
}).strict()

const PopularQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT),
  order_by: z.enum(['createdAt', 'updatedAt', 'likesCount']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
}).strict()

const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(50, 'Search query must be at most 50 characters')
}).strict()

const router = Router()
const factRepository = new PrismaFactRepository()
const userRepository = new PrismaUserRepository()
const hashtagRepository = new PrismaHashtagRepository()
const createFact = new CreateFact(factRepository)
const getFactById = new GetFactById(factRepository)
const updateFact = new UpdateFact(factRepository)
const deleteFact = new DeleteFact(factRepository)
const getFacts = new GetFacts(factRepository)
const getFactsByAuthor = new GetFactsByAuthor(factRepository)
const getPopularFacts = new GetPopularFacts(factRepository)
const searchPosts = new SearchPosts(factRepository)
const searchHashtags = new SearchHashtags(hashtagRepository)

router.post('/', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body
    const authorId = req.user?.uid as string

    const fact = await createFact.execute({ title, content }, authorId)
    res.status(201).json(fact)
  } catch (err) {
    next(err)
  }
})

router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const viewerId = req.user?.uid as string | undefined
    const result = await getFacts.execute({ page, limit, order_by, order_dir }, viewerId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/author/:authorId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const authorId = req.params.authorId as string
    const viewerId = req.user?.uid as string | undefined
    const result = await getFactsByAuthor.execute(authorId, { page, limit, order_by, order_dir }, viewerId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/popular', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = PopularQuerySchema.parse(req.query)
    const viewerId = req.user?.uid as string | undefined
    const result = await getPopularFacts.execute({ page, limit, order_by, order_dir }, viewerId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/search', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = SearchQuerySchema.parse(req.query)
    const sanitized = q.trim()
    const viewerId = req.user?.uid as string | undefined

    if (sanitized.startsWith('@')) {
      const query = sanitized.slice(1)
      const users = await userRepository.findBySearch(query)
      res.status(200).json({
        users: users.map(u => ({
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl
        })),
        facts: [],
        hashtags: []
      })
      return
    }

    if (sanitized.startsWith('#')) {
      const query = sanitized.slice(1)
      const [hashtags, facts] = await Promise.all([
        searchHashtags.execute(query),
        searchPosts.executeByHashtag(query, viewerId)
      ])
      res.status(200).json({ users: [], facts, hashtags })
      return
    }

    const [users, facts, hashtags] = await Promise.all([
      userRepository.findBySearch(sanitized),
      searchPosts.execute(sanitized, viewerId),
      searchHashtags.execute(sanitized)
    ])

    res.status(200).json({
      users: users.map(u => ({
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl
      })),
      facts,
      hashtags
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const viewerId = req.user?.uid as string | undefined
    const fact = await getFactById.execute(id, viewerId)
    res.status(200).json(fact)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const { title, content } = req.body
    const authorId = req.user?.uid as string

    const fact = await updateFact.execute(id, { title, content }, authorId)
    res.status(200).json(fact)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const authorId = req.user?.uid as string

    await deleteFact.execute(id, authorId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
