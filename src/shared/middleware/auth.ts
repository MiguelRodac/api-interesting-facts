import { Request, Response, NextFunction } from 'express'
import './shared/database/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { UnauthorizedError } from '../errors/UnauthorizedError'

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization
  if ((authHeader == null) || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authorization header with Bearer token is required'))
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = await getAuth().verifyIdToken(token);
    (req as any).user = { uid: decoded.uid, email: decoded.email }
    next()
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'))
  }
}
