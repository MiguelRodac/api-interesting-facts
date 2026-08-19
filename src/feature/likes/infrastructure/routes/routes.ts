import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaLikeRepository } from '../repositories/PrismaLikeRepository'
import { PrismaFactRepository } from '../../../facts/infrastructure/repositories/PrismaFactRepository'
import { CreateLike } from '../../application/use-cases/CreateLike'
import { DeleteLike } from '../../application/use-cases/DeleteLike'
import { GetLikesByFact } from '../../application/use-cases/GetLikesByFact'
import { GetLikesByUser } from '../../application/use-cases/GetLikesByUser'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { optionalAuth } from '@shared/infrastructure/middleware/optionalAuth'
import { requireProfile } from '@shared/infrastructure/middleware/requireProfile'

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT),
  order_by: z.enum(['createdAt']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
})

const router = Router()
const likeRepository = new PrismaLikeRepository()
const factRepository = new PrismaFactRepository()
const createLike = new CreateLike(likeRepository, factRepository)
const deleteLike = new DeleteLike(likeRepository)
const getLikesByFact = new GetLikesByFact(likeRepository)
const getLikesByUser = new GetLikesByUser(likeRepository)

router.post('/facts/:factId/likes', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factId = req.params.factId as string
    const userId = req.user?.uid as string

    const like = await createLike.execute(userId, factId)
    res.status(201).json(like)
  } catch (err) {
    next(err)
  }
})

router.delete('/facts/:factId/likes', requireAuth, requireProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factId = req.params.factId as string
    const userId = req.user?.uid as string

    await deleteLike.execute(userId, factId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/facts/:factId/likes', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const factId = req.params.factId as string
    const result = await getLikesByFact.execute(factId, { page, limit, order_by, order_dir })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/users/:userId/likes', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { page, limit, order_by, order_dir } = ListQuerySchema.parse(req.query)
    const userId = req.params.userId as string
    const result = await getLikesByUser.execute(userId, { page, limit, order_by, order_dir })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
