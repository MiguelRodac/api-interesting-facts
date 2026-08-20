import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'
import { PrismaRepostRepository } from '../repositories/PrismaRepostRepository'
import { PrismaFactRepository } from '../../../facts/infrastructure/repositories/PrismaFactRepository'
import { CreateRepost } from '../../application/use-cases/CreateRepost'
import { DeleteRepost } from '../../application/use-cases/DeleteRepost'
import { GetRepostsByFact } from '../../application/use-cases/GetRepostsByFact'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { requireProfile } from '@shared/infrastructure/middleware/requireProfile'

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(100).default(DEFAULT_LIMIT),
  order_by: z.enum(['createdAt']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional()
})

const router = Router()
const repostRepository = new PrismaRepostRepository()
const factRepository = new PrismaFactRepository()
const createRepost = new CreateRepost(repostRepository, factRepository)
const deleteRepost = new DeleteRepost(repostRepository)
const getRepostsByFact = new GetRepostsByFact(repostRepository)

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

export default router
