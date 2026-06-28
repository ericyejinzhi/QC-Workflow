import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { UserProfile } from '../../../model/types'

export interface AuthRequest extends Request {
  user?: UserProfile
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as UserProfile
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
