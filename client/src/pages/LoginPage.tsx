import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import type { UserRole } from '../types'

const roleRedirect: Record<UserRole, string> = {
  operator: '/operator',
  engineer: '/operator',
  qc_head: '/qc',
  approver: '/approvals',
  inventory_manager: '/inventory',
}

const API_URL = import.meta.env.VITE_API_URL as string

export default function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate(roleRedirect[user.role] ?? '/operator', { replace: true })
  }, [user])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(username, password)
    setLoading(false)
    if (err) setError(err)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, full_name: fullName }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Registration failed')
      setLoading(false)
      return
    }

    const err = await signIn(username, password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">QA Workflow</h1>
        <p className="text-gray-500 mb-6 text-sm text-center">
          {mode === 'signin' ? 'Sign in to continue' : 'Create an account'}
        </p>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="text-blue-600 hover:underline"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
