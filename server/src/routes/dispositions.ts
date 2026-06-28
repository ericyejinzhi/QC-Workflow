import { Router } from 'express'
import { supabase } from '../supabase'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('dispositions')
    .select('*, rejections(*, products(*))')
    .order('decided_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('dispositions')
    .insert(req.body)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('dispositions')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
