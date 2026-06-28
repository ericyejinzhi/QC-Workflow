import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../supabase'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

function signToken(payload: object): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set in server/.env')
  return jwt.sign(payload, secret, { expiresIn: '8h' })
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password_hash, full_name, role')
      .eq('username', username)
      .single()

    if (error || !user) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    const payload = { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
    res.json({ token: signToken(payload), user: payload })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, full_name, role } = req.body
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }

    const password_hash = await bcrypt.hash(password, 10)

    const { data: user, error } = await supabase
      .from('users')
      .insert({ username, password_hash, full_name: full_name ?? '', role: role ?? 'operator' })
      .select('id, username, full_name, role')
      .single()

    if (error) {
      const msg = error.message.includes('unique') ? 'Username already taken' : error.message
      res.status(400).json({ error: msg })
      return
    }

    const payload = { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
    res.status(201).json({ token: signToken(payload), user: payload })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json(req.user)
})

export default router
