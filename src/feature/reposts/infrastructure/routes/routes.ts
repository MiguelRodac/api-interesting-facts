import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaRepostRepository } from '../repositories/PrismaRepostRepository'
import { PrismaFactRepository } from '../../../facts/infrastructure/repositories/PrismaFactRepository'
import { PrismaLikeRepository } from '../../../likes/infrastructure/repositories/PrismaLikeRepository'
import { PrismaCommentRepository } from '../../../comments/infrastructure/repositories/PrismaCommentRepository'
import { PrismaMentionRepository } from '../../../mentions/infrastructure/repositories/PrismaMentionRepository'
import { CreateRepost } from '../../application/use-cases/CreateRepost'
import { DeleteRepost } from '../../application/use-cases/DeleteRepost'
import { GetRepostsByFact } from '../../application/use-cases/GetRepostsByFact'
import { CreateRepostLike } from '../../../likes/application/use-cases/CreateRepostLike'
import { DeleteRepostLike } from '../../../likes/application/use-cases/DeleteRepostLike'
import { GetRepostLikes } from '../../../likes/application/use-cases/GetRepostLikes'
import { CreateRepostComment } from '../../../comments/application/use-cases/CreateRepostComment'
import { GetRepostComments } from '../../../comments/application/use-cases/GetRepostComments'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { requireProfile } from '@shared/infrastructure/middleware/requireProfile'

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT),
  order_by: z.enum(['createdAt']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
})

const CreateCommentBodySchema = z.object({
  content: z.string(),
  parentCommentId: z.string().uuid().optional()
})

const router = Router()
const repostRepository = new PrismaRepostRepository()
const factRepository = new PrismaFactRepository()
const likeRepository = new PrismaLikeRepository()
const commentRepository = new PrismaCommentRepository()
const mentionRepository = new PrismaMentionRepository()
const createRepost = new CreateRepost(repostRepository, factRepository)
const deleteRepost = new DeleteRepost(repostRepository)
const getRepostsByFact = new GetRepostsByFact(repostRepository)
const createRepostLike = new CreateRepostLike(likeRepository, repostRepository)
const deleteRepostLike = new DeleteRepostLike(likeRepository)
const getRepostLikes = new GetRepostLikes(likeRepository, repostRepository)
const createRepostComment = new CreateRepostComment(commentRepository, repostRepository, mentionRepository)
const getRepostComments = new GetRepostComments(commentRepository, repostRepository)

// ─── Repost CRUD ───────────────────────────────────────────────────────────

router.post('/facts/:factId/reposts', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factId = req.params.factId as string
    const userId = req.user?.uid as string

    const repost = await createRepost.execute(userId, factId)
    res.status(201).json(repost)
  } catch (err) {
    next(err)
  }
})

router.delete('/facts/:factId/reposts', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factId = req.params.factId as string
    const userId = req.user?.uid as string

    await deleteRepost.execute(userId, factId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/facts/:factId/reposts', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const factId = req.params.factId as string
    const result = await getRepostsByFact.execute(factId, { page, limit, order_by, order_dir })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

// ─── Repost Likes ──────────────────────────────────────────────────────────

router.post('/reposts/:repostId/likes', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repostId = req.params.repostId as string
    const userId = req.user?.uid as string

    const like = await createRepostLike.execute(userId, repostId)
    res.status(201).json(like)
  } catch (err) {
    next(err)
  }
})

router.delete('/reposts/:repostId/likes', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repostId = req.params.repostId as string
    const userId = req.user?.uid as string

    await deleteRepostLike.execute(userId, repostId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/reposts/:repostId/likes', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const repostId = req.params.repostId as string
    const result = await getRepostLikes.execute(repostId, { page, limit, order_by, order_dir })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

// ─── Repost Comments ───────────────────────────────────────────────────────

router.post('/reposts/:repostId/comments', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, parentCommentId } = CreateCommentBodySchema.parse(req.body)
    const repostId = req.params.repostId as string
    const authorId = req.user?.uid as string

    const result = await createRepostComment.execute(repostId, { content, parentCommentId }, authorId)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/reposts/:repostId/comments', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const repostId = req.params.repostId as string
    const viewerId = req.user?.uid
    const result = await getRepostComments.execute(repostId, { page, limit, order_by, order_dir }, viewerId)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
