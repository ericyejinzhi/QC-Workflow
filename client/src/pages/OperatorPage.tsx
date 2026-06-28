import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../lib/api'
import type { Product, ProductType } from '../types'

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  fins: 'Fins',
  bottom_roll: 'Bottom Roll',
  sleeve: 'Sleeve',
  case: 'Case',
  palette: 'Palette',
}

export default function OperatorPage() {
  const { user, signOut } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Product[]>('/products').then(setProducts).catch(console.error)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await apiFetch('/rejections', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity, rejection_reason: reason }),
      })
      setSuccess(true)
      setProductId('')
      setQuantity(1)
      setReason('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Submit Rejection</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.full_name}</span>
            <button onClick={signOut} className="text-sm text-red-500 hover:underline">Sign out</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <select
              required
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {PRODUCT_TYPE_LABELS[p.product_type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              required
              min={1}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason for Rejection</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe the defect..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">Rejection submitted successfully.</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 text-white py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Rejection'}
          </button>
        </form>
      </div>
    </div>
  )
}
