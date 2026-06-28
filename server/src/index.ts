import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import productsRouter from './routes/products'
import rejectionsRouter from './routes/rejections'
import dispositionsRouter from './routes/dispositions'
import approvalsRouter from './routes/approvals'
import { requireAuth } from './middleware/auth'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/auth', authRouter)

app.use(requireAuth)
app.use('/products', productsRouter)
app.use('/rejections', rejectionsRouter)
app.use('/dispositions', dispositionsRouter)
app.use('/approvals', approvalsRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
