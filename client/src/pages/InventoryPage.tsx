import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../lib/api'
import type { Disposition, Rejection, Product } from '../types'

type ApprovedDisposition = Disposition & {
  rejections: Rejection & { products: Product }
}

const DECISION_LABELS: Record<string, string> = {
  scrap: 'Scrap',
  sort: 'Sort',
  return_to_line: 'Return to Line',
}

const DECISION_COLORS: Record<string, string> = {
  scrap: 'bg-red-100 text-red-700',
  sort: 'bg-yellow-100 text-yellow-700',
  return_to_line: 'bg-green-100 text-green-700',
}

export default function InventoryPage() {
  const { user, signOut } = useAuth()
  const [dispositions, setDispositions] = useState<ApprovedDisposition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<ApprovedDisposition[]>('/dispositions')
      .then(data => setDispositions(data.filter(d => d.approval_status === 'approved')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Approved Dispositions</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.full_name}</span>
            <button onClick={signOut} className="text-sm text-red-500 hover:underline">Sign out</button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : dispositions.length === 0 ? (
          <div className="bg-white rounded shadow p-6 text-sm text-gray-400">
            No approved dispositions yet.
          </div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Disposition</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Approved</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dispositions.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{d.rejections.products.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.rejections.products.product_type}</td>
                    <td className="px-4 py-3">{d.rejections.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${DECISION_COLORS[d.decision]}`}>
                        {DECISION_LABELS[d.decision]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(d.decided_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
