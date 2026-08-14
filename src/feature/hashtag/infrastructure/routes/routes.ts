import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { PrismaHashtagRepository } from '../repositories/PrismaHashtagRepository'
import { GetHashtags } from '../../application/use-cases/GetHashtags'
import { requireAuth } from '@shared/infrastructure/middleware/auth'

const HashtagQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(20).default(10)
}).strict()

const router = Router()
const hashtagRepository = new PrismaHashtagRepository()
const getHashtags = new GetHashtags(hashtagRepository)

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = HashtagQuerySchema.parse(req.query)
    const results = await getHashtags.execute(q, limit)
    res.status(200).json({ results })
  } catch (err) {
    next(err)
  }
})

export default router
