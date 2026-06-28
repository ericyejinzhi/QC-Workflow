import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../lib/api'
import type { Rejection, Product, DispositionDecision } from '../types'

type RejectionWithProduct = Rejection & { products: Product }

const DECISIONS: { value: DispositionDecision; label: string }[] = [
  { value: 'scrap', label: 'Scrap' },
  { value: 'sort', label: 'Sort' },
  { value: 'return_to_line', label: 'Return to Line' },
]

export default function QCHeadPage() {
  const { user, signOut } = useAuth()
  const [rejections, setRejections] = useState<RejectionWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [decisions, setDecisions] = useState<Record<string, DispositionDecision>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function load() {
    try {
      const data = await apiFetch<RejectionWithProduct[]>('/rejections')
      setRejections(data.filter(r => r.status === 'pending_disposition'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDisposition(rejectionId: string) {
    const decision = decisions[rejectionId]
    if (!decision) return
    setSubmitting(s => ({ ...s, [rejectionId]: true }))
    setErrors(e => ({ ...e, [rejectionId]: '' }))
    try {
      await apiFetch('/dispositions', {
        method: 'POST',
        body: JSON.stringify({
          rejection_id: rejectionId,
          decision,
          notes: notes[rejectionId] ?? '',
          decided_by: user!.id,
        }),
      })
      await load()
    } catch (err: any) {
      setErrors(e => ({ ...e, [rejectionId]: err.message }))
    } finally {
      setSubmitting(s => ({ ...s, [rejectionId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quality Control — Disposition</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.full_name}</span>
            <button onClick={signOut} className="text-sm text-red-500 hover:underline">Sign out</button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : rejections.length === 0 ? (
          <div className="bg-white rounded shadow p-6 text-sm text-gray-400">
            No pending rejections.
          </div>
        ) : (
          <div className="space-y-4">
            {rejections.map(r => (
              <div key={r.id} className="bg-white rounded shadow p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-4">
                  <div><span className="text-gray-500">Product: </span>{r.products.name}</div>
                  <div><span className="text-gray-500">Type: </span>{r.products.product_type}</div>
                  <div><span className="text-gray-500">Quantity: </span>{r.quantity}</div>
                  <div><span className="text-gray-500">Reported: </span>{new Date(r.created_at).toLocaleDateString()}</div>
                  <div className="col-span-2"><span className="text-gray-500">Reason: </span>{r.rejection_reason}</div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex gap-2">
                    {DECISIONS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setDecisions(s => ({ ...s, [r.id]: d.value }))}
                        className={`px-4 py-1.5 rounded text-sm border font-medium transition-colors ${
                          decisions[r.id] === d.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Notes (optional)"
                    value={notes[r.id] ?? ''}
                    onChange={e => setNotes(s => ({ ...s, [r.id]: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />

                  {errors[r.id] && <p className="text-sm text-red-500">{errors[r.id]}</p>}

                  <button
                    disabled={!decisions[r.id] || !!submitting[r.id]}
                    onClick={() => handleDisposition(r.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
                  >
                    {submitting[r.id] ? 'Saving...' : 'Set Disposition'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
