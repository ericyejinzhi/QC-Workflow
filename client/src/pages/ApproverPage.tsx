import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../lib/api'
import type { Approval, Disposition, Rejection, Product } from '../types'

type FullApprovalRecord = Disposition & {
  rejections: Rejection & { products: Product }
}

export default function ApproverPage() {
  const { user, signOut } = useAuth()
  const [dispositions, setDispositions] = useState<FullApprovalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function load() {
    try {
      const data = await apiFetch<FullApprovalRecord[]>('/dispositions')
      setDispositions(data.filter(d => d.approval_status === 'pending'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleApproval(dispositionId: string, status: Approval['status']) {
    setSubmitting(s => ({ ...s, [dispositionId]: true }))
    setErrors(e => ({ ...e, [dispositionId]: '' }))
    try {
      await apiFetch('/approvals', {
        method: 'POST',
        body: JSON.stringify({
          disposition_id: dispositionId,
          reviewed_by: user!.id,
          status,
          comments: comments[dispositionId] ?? '',
        }),
      })
      await load()
    } catch (err: any) {
      setErrors(e => ({ ...e, [dispositionId]: err.message }))
    } finally {
      setSubmitting(s => ({ ...s, [dispositionId]: false }))
    }
  }

  const DECISION_LABELS: Record<string, string> = {
    scrap: 'Scrap',
    sort: 'Sort',
    return_to_line: 'Return to Line',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.full_name}</span>
            <button onClick={signOut} className="text-sm text-red-500 hover:underline">Sign out</button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : dispositions.length === 0 ? (
          <div className="bg-white rounded shadow p-6 text-sm text-gray-400">
            No dispositions pending approval.
          </div>
        ) : (
          <div className="space-y-4">
            {dispositions.map(d => (
              <div key={d.id} className="bg-white rounded shadow p-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-4">
                  <div><span className="text-gray-500">Product: </span>{d.rejections.products.name}</div>
                  <div><span className="text-gray-500">Type: </span>{d.rejections.products.product_type}</div>
                  <div><span className="text-gray-500">Quantity: </span>{d.rejections.quantity}</div>
                  <div><span className="text-gray-500">Disposition: </span>
                    <span className="font-medium">{DECISION_LABELS[d.decision]}</span>
                  </div>
                  <div className="col-span-2"><span className="text-gray-500">Rejection reason: </span>{d.rejections.rejection_reason}</div>
                  {d.notes && <div className="col-span-2"><span className="text-gray-500">QC notes: </span>{d.notes}</div>}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <textarea
                    rows={2}
                    placeholder="Comments (optional)"
                    value={comments[d.id] ?? ''}
                    onChange={e => setComments(s => ({ ...s, [d.id]: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />

                  {errors[d.id] && <p className="text-sm text-red-500">{errors[d.id]}</p>}

                  <div className="flex gap-2">
                    <button
                      disabled={!!submitting[d.id]}
                      onClick={() => handleApproval(d.id, 'approved')}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-40"
                    >
                      {submitting[d.id] ? 'Saving...' : 'Approve'}
                    </button>
                    <button
                      disabled={!!submitting[d.id]}
                      onClick={() => handleApproval(d.id, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
