import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaCommentRepository } from '../repositories/PrismaCommentRepository'
import { PrismaFactRepository } from '../../../facts/infrastructure/repositories/PrismaFactRepository'
import { CreateComment } from '../../application/use-cases/CreateComment'
import { DeleteComment } from '../../application/use-cases/DeleteComment'
import { GetCommentsByFact } from '../../application/use-cases/GetCommentsByFact'
import { GetCommentsByUser } from '../../application/use-cases/GetCommentsByUser'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { optionalAuth } from '@shared/infrastructure/middleware/optionalAuth'
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
const commentRepository = new PrismaCommentRepository()
const factRepository = new PrismaFactRepository()
const createComment = new CreateComment(commentRepository, factRepository)
const deleteComment = new DeleteComment(commentRepository)
const getCommentsByFact = new GetCommentsByFact(commentRepository, factRepository)
const getCommentsByUser = new GetCommentsByUser(commentRepository)

router.post('/facts/:factId/comments', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, parentCommentId } = CreateCommentBodySchema.parse(req.body)
    const factId = req.params.factId as string
    const authorId = req.user?.uid as string

    const result = await createComment.execute(factId, { content, parentCommentId }, authorId)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.delete('/comments/:id', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const authorId = req.user?.uid as string

    await deleteComment.execute(id, authorId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/facts/:factId/comments', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const factId = req.params.factId as string
    const result = await getCommentsByFact.execute(factId, { page, limit, order_by, order_dir })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/users/:userId/comments', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const userId = req.params.userId as string
    const result = await getCommentsByUser.execute(userId, { page, limit, order_by, order_dir })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
