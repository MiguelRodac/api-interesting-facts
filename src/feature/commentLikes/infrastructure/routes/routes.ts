import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaCommentLikeRepository } from '../repositories/PrismaCommentLikeRepository'
import { PrismaCommentRepository } from '../../../comments/infrastructure/repositories/PrismaCommentRepository'
import { CreateCommentLike } from '../../application/use-cases/CreateCommentLike'
import { DeleteCommentLike } from '../../application/use-cases/DeleteCommentLike'
import { GetCommentLikesByCommentId } from '../../application/use-cases/GetCommentLikesByCommentId'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { requireProfile } from '@shared/infrastructure/middleware/requireProfile'

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT),
  order_by: z.enum(['createdAt']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
})

const router = Router()
const commentLikeRepository = new PrismaCommentLikeRepository()
const commentRepository = new PrismaCommentRepository()
const createCommentLike = new CreateCommentLike(commentLikeRepository, commentRepository)
const deleteCommentLike = new DeleteCommentLike(commentLikeRepository, commentRepository)
const getCommentLikesByCommentId = new GetCommentLikesByCommentId(commentLikeRepository)

router.post('/facts/:factId/comments/:commentId/likes', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factId = req.params.factId as string
    const commentId = req.params.commentId as string
    const userId = req.user?.uid as string

    const like = await createCommentLike.execute(factId, commentId, userId)
    res.status(201).json(like)
  } catch (err) {
    next(err)
  }
})

router.delete('/facts/:factId/comments/:commentId/likes', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factId = req.params.factId as string
    const commentId = req.params.commentId as string
    const userId = req.user?.uid as string

    await deleteCommentLike.execute(factId, commentId, userId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/facts/:factId/comments/:commentId/likes', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const commentId = req.params.commentId as string
    const result = await getCommentLikesByCommentId.execute(commentId, { page, limit, order_by, order_dir })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
