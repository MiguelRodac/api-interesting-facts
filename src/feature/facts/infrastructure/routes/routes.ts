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

const SearchOrderSchema = z.enum(['popular', 'recent'])
const SearchDirSchema = z.enum(['asc', 'desc'])

const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(50, 'Search query must be at most 50 characters'),
  order_by: SearchOrderSchema.default('popular'),
  order_dir: SearchDirSchema.default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100)
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

router.get('/search', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, order_by, order_dir, page, limit } = SearchQuerySchema.parse(req.query)
    const sanitized = q.trim()
    const viewerId = req.user?.uid as string | undefined
    const skip = (page - 1) * limit

    // Fetch enough to cover the page + detect hasMore (request limit+1)
    const fetchLimit = limit + 1

    if (sanitized.startsWith('@')) {
      const query = sanitized.slice(1)
      const [users, facts] = await Promise.all([
        userRepository.findBySearch(query, { order_by, order_dir, limit: fetchLimit }),
        searchPosts.executeByAuthorOrMention(query, viewerId, { order_by, order_dir, limit: fetchLimit })
      ])

      // Paginate merged results
      const merged = [...users, ...facts]
      const total = merged.length
      const hasMore = total > limit
      const paged = merged.slice(skip, skip + limit)

      const pagedUsers = paged.filter(item => 'username' in item).map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor
      }))
      const pagedFacts = paged.filter(item => 'content' in item)

      res.status(200).json({
        users: pagedUsers,
        facts: pagedFacts,
        hashtags: [],
        page,
        limit,
        hasMore
      })
      return
    }

    if (sanitized.startsWith('#')) {
      const query = sanitized.slice(1)
      const [hashtags, facts] = await Promise.all([
        searchHashtags.execute(query, { order_by, order_dir, limit: fetchLimit }),
        searchPosts.executeByHashtag(query, viewerId, { order_by, order_dir, limit: fetchLimit })
      ])

      const merged = [...hashtags, ...facts]
      const total = merged.length
      const hasMore = total > limit
      const paged = merged.slice(skip, skip + limit)

      const pagedHashtags = paged.filter(item => 'tag' in item)
      const pagedFacts = paged.filter(item => 'content' in item)

      res.status(200).json({
        users: [],
        facts: pagedFacts,
        hashtags: pagedHashtags,
        page,
        limit,
        hasMore
      })
      return
    }

    // Plain query — merge all categories
    const [users, factsByTitleOrHashtag, hashtags, factsByAuthorOrMention] = await Promise.all([
      userRepository.findBySearch(sanitized, { order_by, order_dir, limit: fetchLimit }),
      searchPosts.execute(sanitized, viewerId, { order_by, order_dir, limit: fetchLimit }),
      searchHashtags.execute(sanitized, { order_by, order_dir, limit: fetchLimit }),
      searchPosts.executeByAuthorOrMention(sanitized, viewerId, { order_by, order_dir, limit: fetchLimit })
    ])

    // Merge facts, deduplicating by id
    const factsMap = new Map<string, typeof factsByTitleOrHashtag[0]>()
    for (const fact of factsByTitleOrHashtag) {
      factsMap.set(fact.id, fact)
    }
    for (const fact of factsByAuthorOrMention) {
      if (!factsMap.has(fact.id)) {
        factsMap.set(fact.id, fact)
      }
    }
    const mergedFacts = Array.from(factsMap.values())

    // Merge all into one list for pagination: users, hashtags, then facts
    const allItems: Array<Record<string, unknown>> = [
      ...users.map(u => ({ ...u, __type: 'user' })),
      ...hashtags.map(h => ({ ...h, __type: 'hashtag' })),
      ...mergedFacts.map(f => ({ ...f, __type: 'fact' }))
    ]

    const total = allItems.length
    const hasMore = total > limit
    const paged = allItems.slice(skip, skip + limit)

    const pagedUsers = paged.filter(item => item.__type === 'user').map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      avatarColor: u.avatarColor
    }))
    const pagedHashtags = paged.filter(item => item.__type === 'hashtag')
    const pagedFacts = paged.filter(item => item.__type === 'fact')

    res.status(200).json({
      users: pagedUsers,
      facts: pagedFacts,
      hashtags: pagedHashtags,
      page,
      limit,
      hasMore
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
