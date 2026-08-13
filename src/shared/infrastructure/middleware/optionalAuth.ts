import { type Request, type Response, type NextFunction } from 'express'
import '../firebase/admin'
import { getAuth } from 'firebase-admin/auth'

/**
 * Optional auth middleware for public GET routes that need to know the viewer.
 * Does NOT reject if no token is provided — sets req.user only when valid.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization
  if ((authHeader == null) || !authHeader.startsWith('Bearer ')) {
    next()
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = await getAuth().verifyIdToken(token)
    req.user = { uid: decoded.uid, email: decoded.email }
  } catch {
    // Invalid or expired token — treat as unauthenticated, do not error
  }
  next()
}
