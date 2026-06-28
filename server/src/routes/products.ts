import { Router } from 'express'
import { supabase } from '../supabase'

const router = Router()

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { name, product_type } = req.body
  const { data, error } = await supabase
    .from('products')
    .insert({ name, product_type })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

export default router
