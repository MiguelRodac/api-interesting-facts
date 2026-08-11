import { type Request, type Response, type NextFunction } from 'express'
import prisma from '../prisma'
import { ForbiddenError } from '../../domain/errors/ForbiddenError'

export const requireProfile = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const uid = req.user?.uid

  if (uid == null) {
    next(new ForbiddenError('Authentication required'))
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid }
    })

    if (user == null) {
      next(new ForbiddenError('User profile not found. Please complete onboarding.'))
      return
    }

    req.user = {
      ...req.user,
      uid: user.firebaseUid,
      email: user.email,
      username: user.username,
      displayName: user.displayName
    }

    next()
  } catch (err) {
    next(err)
  }
}
