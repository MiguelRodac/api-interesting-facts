import { Router, type Request, type Response, type NextFunction } from 'express'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { GetUserByUsername } from '../../application/use-cases/GetUserByUsername'

const router = Router()
const userRepository = new PrismaUserRepository()
const getUserByUsername = new GetUserByUsername(userRepository)

// GET /users/:username — Get public profile by username
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username as string
    const user = await getUserByUsername.execute(username)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
})

export default router
