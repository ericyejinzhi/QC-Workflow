const API_URL = import.meta.env.VITE_API_URL as string

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? res.statusText)
  return data as T
}
