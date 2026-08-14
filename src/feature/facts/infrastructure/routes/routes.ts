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
  order_dir: SearchDirSchema.default('desc')
}).strict()

// Cap per category — request +1 to detect "has more" without COUNT query
const MAX_SEARCH_USERS = 10
const MAX_SEARCH_HASHTAGS = 10
const MAX_SEARCH_FACTS = 80
const MAX_SEARCH_TOTAL = 100
const SEARCH_FETCH_USERS = MAX_SEARCH_USERS + 1
const SEARCH_FETCH_HASHTAGS = MAX_SEARCH_HASHTAGS + 1
const SEARCH_FETCH_FACTS = MAX_SEARCH_FACTS + 1

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
    const { q, order_by, order_dir } = SearchQuerySchema.parse(req.query)
    const sanitized = q.trim()
    const viewerId = req.user?.uid as string | undefined

    if (sanitized.startsWith('@')) {
      const query = sanitized.slice(1)
      const orderParams = { order_by, order_dir, limit: SEARCH_FETCH_USERS }
      const [users, facts] = await Promise.all([
        userRepository.findBySearch(query, orderParams),
        searchPosts.executeByAuthorOrMention(query, viewerId, { order_by, order_dir, limit: SEARCH_FETCH_FACTS })
      ])
      const hasMoreUsers = users.length > MAX_SEARCH_USERS
      const hasMoreFacts = facts.length > MAX_SEARCH_FACTS
      const cappedFacts = facts.slice(0, MAX_SEARCH_FACTS)
      const total = users.length + cappedFacts.length
      if (total > MAX_SEARCH_TOTAL) {
        cappedFacts.splice(MAX_SEARCH_TOTAL - users.length)
      }
      res.status(200).json({
        users: users.slice(0, MAX_SEARCH_USERS).map(u => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          avatarColor: u.avatarColor
        })),
        facts: cappedFacts,
        hashtags: [],
        hasMoreUsers,
        hasMoreFacts,
        hasMoreHashtags: false
      })
      return
    }

    if (sanitized.startsWith('#')) {
      const query = sanitized.slice(1)
      const orderParams = { order_by, order_dir, limit: SEARCH_FETCH_HASHTAGS }
      const [hashtags, facts] = await Promise.all([
        searchHashtags.execute(query, orderParams),
        searchPosts.executeByHashtag(query, viewerId, { order_by, order_dir, limit: SEARCH_FETCH_FACTS })
      ])
      const hasMoreHashtags = hashtags.length > MAX_SEARCH_HASHTAGS
      const hasMoreFacts = facts.length > MAX_SEARCH_FACTS
      const cappedFacts = facts.slice(0, MAX_SEARCH_FACTS)
      const total = hashtags.length + cappedFacts.length
      if (total > MAX_SEARCH_TOTAL) {
        cappedFacts.splice(MAX_SEARCH_TOTAL - hashtags.length)
      }
      res.status(200).json({
        users: [],
        facts: cappedFacts,
        hashtags: hashtags.slice(0, MAX_SEARCH_HASHTAGS),
        hasMoreUsers: false,
        hasMoreFacts,
        hasMoreHashtags
      })
      return
    }

    const [users, factsByTitleOrHashtag, hashtags, factsByAuthorOrMention] = await Promise.all([
      userRepository.findBySearch(sanitized, { order_by, order_dir, limit: SEARCH_FETCH_USERS }),
      searchPosts.execute(sanitized, viewerId, { order_by, order_dir, limit: SEARCH_FETCH_FACTS }),
      searchHashtags.execute(sanitized, { order_by, order_dir, limit: SEARCH_FETCH_HASHTAGS }),
      searchPosts.executeByAuthorOrMention(sanitized, viewerId, { order_by, order_dir, limit: SEARCH_FETCH_FACTS })
    ])

    // Merge facts from both searches, deduplicating by id
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

    const hasMoreUsers = users.length > MAX_SEARCH_USERS
    const hasMoreFacts = mergedFacts.length > MAX_SEARCH_FACTS
    const hasMoreHashtags = hashtags.length > MAX_SEARCH_HASHTAGS

    // Cap each category and ensure total <= 100
    const cappedUsers = users.slice(0, MAX_SEARCH_USERS)
    const cappedHashtags = hashtags.slice(0, MAX_SEARCH_HASHTAGS)
    const remainingForFacts = MAX_SEARCH_TOTAL - cappedUsers.length - cappedHashtags.length
    const cappedFacts = mergedFacts.slice(0, remainingForFacts)

    res.status(200).json({
      users: cappedUsers.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor
      })),
      facts: cappedFacts,
      hashtags: cappedHashtags,
      hasMoreUsers,
      hasMoreFacts,
      hasMoreHashtags
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
