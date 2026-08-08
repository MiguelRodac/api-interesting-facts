declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string
        email?: string
        username?: string
        displayName?: string
      }
    }
  }
}

export {}
