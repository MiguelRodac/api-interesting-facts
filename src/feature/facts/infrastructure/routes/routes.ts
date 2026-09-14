import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaFactRepository } from '../repositories/PrismaFactRepository'
import { PrismaUserRepository } from '@user/infrastructure/repositories/PrismaUserRepository'
import { PrismaHashtagRepository } from '@hashtag/infrastructure/repositories/PrismaHashtagRepository'
import { PrismaRepostRepository } from '@reposts/infrastructure/repositories/PrismaRepostRepository'
import { PrismaLikeRepository } from '@likes/infrastructure/repositories/PrismaLikeRepository'
import { PrismaCommentRepository } from '@comments/infrastructure/repositories/PrismaCommentRepository'
import { CreateFact } from '../../application/use-cases/CreateFact'
import { GetFactById } from '../../application/use-cases/GetFactById'
import { UpdateFact } from '../../application/use-cases/UpdateFact'
import { DeleteFact } from '../../application/use-cases/DeleteFact'
import { GetFacts } from '../../application/use-cases/GetFacts'
import { GetFactsByAuthor } from '../../application/use-cases/GetFactsByAuthor'
import { GetPopularFacts } from '../../application/use-cases/GetPopularFacts'
import { SearchPosts } from '../../application/use-cases/SearchPosts'
import { type FeedEntry } from '../../application/dto/FeedEntry'
import { SearchHashtags } from '@hashtag/application/use-cases/SearchHashtags'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { optionalAuth } from '@shared/infrastructure/middleware/optionalAuth'
import { requireProfile } from '@shared/infrastructure/middleware/requireProfile'

import { sanitizeUnicode } from '@shared/domain/utils/unicode'

const CursorListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT)
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

const CreateFactBodySchema = z.object({
  title: z.string().transform((s: string): string => sanitizeUnicode(s)).optional().nullable(),
  content: z.string({ required_error: 'Content is required' }).transform((s: string): string => sanitizeUnicode(s))
}).strict()

const UpdateFactBodySchema = z.object({
  title: z.string().transform((s: string): string => sanitizeUnicode(s)).optional().nullable(),
  content: z.string().transform((s: string): string => sanitizeUnicode(s)).optional()
}).strict().refine(data => data.title !== undefined || data.content !== undefined, {
  message: 'At least one field (title or content) must be provided'
})

const router = Router()
const factRepository = new PrismaFactRepository()
const userRepository = new PrismaUserRepository()
const hashtagRepository = new PrismaHashtagRepository()
const repostRepository = new PrismaRepostRepository()
const likeRepository = new PrismaLikeRepository()
const commentRepository = new PrismaCommentRepository()
const createFact = new CreateFact(factRepository)
const getFactById = new GetFactById(factRepository)
const updateFact = new UpdateFact(factRepository)
const deleteFact = new DeleteFact(factRepository)
const getFacts = new GetFacts(factRepository, repostRepository, likeRepository, commentRepository)
const getFactsByAuthor = new GetFactsByAuthor(factRepository, repostRepository, likeRepository, commentRepository)
const getPopularFacts = new GetPopularFacts(factRepository)
const searchPosts = new SearchPosts(factRepository, repostRepository, likeRepository, commentRepository)
const searchHashtags = new SearchHashtags(hashtagRepository)

router.post('/', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = CreateFactBodySchema.parse(req.body)
    const authorId = req.user?.uid as string

    const fact = await createFact.execute({
      title: typeof title === 'string' ? title : undefined,
      content
    }, authorId)
    res.status(201).json(fact)
  } catch (err) {
    next(err)
  }
})

router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cursor, limit } = CursorListQuerySchema.parse(req.query)
    const viewerId = req.user?.uid
    const result = await getFacts.execute({ cursor, limit }, viewerId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/author/:authorId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cursor, limit } = CursorListQuerySchema.parse(req.query)
    const authorId = req.params.authorId as string
    const viewerId = req.user?.uid
    const result = await getFactsByAuthor.execute(authorId, { cursor, limit }, viewerId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/popular', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = PopularQuerySchema.parse(req.query)
    const viewerId = req.user?.uid
    const result = await getPopularFacts.execute({ page, limit, order_by, order_dir }, viewerId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/search', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, order_by: orderBy, order_dir: orderDir, page, limit } = SearchQuerySchema.parse(req.query)
    const sanitized = q.trim()
    const viewerId = req.user?.uid
    const skip = (page - 1) * limit
    const orderParams = { page, order_by: orderBy, order_dir: orderDir, skip, limit }

    if (sanitized.startsWith('@')) {
      const query = sanitized.slice(1)
      const [usersResult, feedResult] = await Promise.all([
        userRepository.findBySearch(query, orderParams),
        searchPosts.executeByAuthorOrMention(query, viewerId, orderParams)
      ])

      const hasMore = (usersResult.nextPage !== null) || feedResult.hasMore
      const pagedEntries = feedResult.results

      res.status(200).json({
        users: usersResult.results.map(u => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          avatarColor: u.avatarColor
        })),
        results: pagedEntries,
        hashtags: [],
        page,
        limit,
        hasMore
      })
      return
    }

    if (sanitized.startsWith('#')) {
      const query = sanitized.slice(1)
      const [hashtagsResult, feedResult] = await Promise.all([
        searchHashtags.execute(query, orderParams),
        searchPosts.executeByHashtag(query, viewerId, orderParams)
      ])

      const hasMore = hashtagsResult.hasMore || feedResult.hasMore
      const pagedEntries = feedResult.results

      res.status(200).json({
        users: [],
        results: pagedEntries,
        hashtags: hashtagsResult.results,
        page,
        limit,
        hasMore
      })
      return
    }

    // Plain query — merge all categories
    const [usersResult, factsResult, hashtagsResult, authorMentionResult] = await Promise.all([
      userRepository.findBySearch(sanitized, orderParams),
      searchPosts.execute(sanitized, viewerId, orderParams),
      searchHashtags.execute(sanitized, orderParams),
      searchPosts.executeByAuthorOrMention(sanitized, viewerId, orderParams)
    ])

    const entriesMap = new Map<string, FeedEntry>()
    for (const entry of factsResult.results) {
      const key = entry.type === 'fact' ? entry.fact.id : entry.repost.id
      entriesMap.set(key, entry)
    }
    for (const entry of authorMentionResult.results) {
      const key = entry.type === 'fact' ? entry.fact.id : entry.repost.id
      if (!entriesMap.has(key)) {
        entriesMap.set(key, entry)
      }
    }
    const mergedEntries = Array.from(entriesMap.values())
    const pagedEntries = mergedEntries.slice(0, limit)

    const hasMore = (usersResult.nextPage !== null) ||
      hashtagsResult.hasMore ||
      factsResult.hasMore ||
      authorMentionResult.hasMore ||
      mergedEntries.length > limit

    res.status(200).json({
      users: usersResult.results.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor
      })),
      results: pagedEntries,
      hashtags: hashtagsResult.results,
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
    const viewerId = req.user?.uid
    const fact = await getFactById.execute(id, viewerId)
    res.status(200).json(fact)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const { title, content } = UpdateFactBodySchema.parse(req.body)
    const authorId = req.user?.uid as string

    const fact = await updateFact.execute(id, {
      title: typeof title === 'string' ? title : undefined,
      content
    }, authorId)
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
