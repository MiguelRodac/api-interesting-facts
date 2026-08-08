import { Router, type Request, type Response, type NextFunction } from 'express'
import { PrismaLikeRepository } from '../repositories/PrismaLikeRepository'
import { PrismaFactRepository } from '../../../facts/infrastructure/repositories/PrismaFactRepository'
import { CreateLike } from '../../application/use-cases/CreateLike'
import { DeleteLike } from '../../application/use-cases/DeleteLike'
import { GetLikesByFact } from '../../application/use-cases/GetLikesByFact'
import { GetLikesByUser } from '../../application/use-cases/GetLikesByUser'
import { requireAuth } from '../../../../shared/infrastructure/middleware/auth'
import { requireProfile } from '../../../../shared/infrastructure/middleware/requireProfile'

const router = Router()
const likeRepository = new PrismaLikeRepository()
const factRepository = new PrismaFactRepository()
const createLike = new CreateLike(likeRepository, factRepository)
const deleteLike = new DeleteLike(likeRepository)
const getLikesByFact = new GetLikesByFact(likeRepository)
const getLikesByUser = new GetLikesByUser(likeRepository)

// POST /facts/:factId/likes — Like a fact (authenticated + profile required)
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

// DELETE /facts/:factId/likes — Unlike a fact (authenticated + profile required)
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

// GET /facts/:factId/likes — Get likes for a fact (public)
router.get('/facts/:factId/likes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factId = req.params.factId as string

    const likes = await getLikesByFact.execute(factId)
    res.status(200).json(likes)
  } catch (err) {
    next(err)
  }
})

// GET /users/:userId/likes — Get likes by a user (public)
router.get('/users/:userId/likes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string

    const likes = await getLikesByUser.execute(userId)
    res.status(200).json(likes)
  } catch (err) {
    next(err)
  }
})

export default router
