import { createContext, useContext, useEffect, useState } from 'react'
import type { UserProfile } from './types'

const API_URL = import.meta.env.VITE_API_URL as string

interface AuthContextValue {
  user: UserProfile | null
  token: string | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<string | null>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored) { setLoading(false); return }

    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setToken(stored); setUser(data) }
        else localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function signIn(username: string, password: string): Promise<string | null> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) return data.error ?? 'Login failed'

    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return null
  }

  function signOut() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
