import { Router } from 'express'
import { supabase } from '../supabase'
import type { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('rejections')
    .select('*, products(*)')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req: AuthRequest, res) => {
  const { product_id, quantity, rejection_reason } = req.body
  const { data, error } = await supabase
    .from('rejections')
    .insert({ product_id, quantity, rejection_reason, submitted_by: req.user!.id })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

export default router
