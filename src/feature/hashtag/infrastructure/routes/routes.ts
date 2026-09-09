import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { PrismaHashtagRepository } from '../repositories/PrismaHashtagRepository'
import { GetHashtags } from '../../application/use-cases/GetHashtags'
import { requireAuth } from '@shared/infrastructure/middleware/auth'
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@shared/domain/types/query-filters'

const HashtagQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(50).default(DEFAULT_LIMIT)
}).strict()

const router = Router()
const hashtagRepository = new PrismaHashtagRepository()
const getHashtags = new GetHashtags(hashtagRepository)

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page, limit } = HashtagQuerySchema.parse(req.query)
    const { results, hasMore } = await getHashtags.execute(q, page, limit)
    res.status(200).json({
      results,
      page,
      limit,
      hasMore
    })
  } catch (err) {
    next(err)
  }
})

export default router
