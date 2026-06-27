import { useState } from 'react'
import type { AuthUser } from '../types'

const API_URL = 'http://localhost:8000'

interface Props {
  onSuccess: (token: string, user: AuthUser) => void
  onNavigateToLogin: () => void
  onContinueAsGuest: () => void
}

export default function RegisterView({ onSuccess, onNavigateToLogin, onContinueAsGuest }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.detail ?? 'Registration failed')
        return
      }
      onSuccess(data.access_token, data.user)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Join Sneaker Shop</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <button
            onClick={onNavigateToLogin}
            className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-400"
          >
            Sign in to existing account
          </button>
          <button
            onClick={onContinueAsGuest}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  )
}
