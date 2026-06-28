import { Router } from 'express'
import { supabase } from '../supabase'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('approvals')
    .select('*, dispositions(*, rejections(*, products(*)))')
    .order('reviewed_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('approvals')
    .insert(req.body)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

export default router
