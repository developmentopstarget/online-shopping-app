import { useState } from 'react'
import type { AuthUser } from '../types'

interface AuthState {
  token: string | null
  user: AuthUser | null
}

function loadSession(): AuthState {
  const token = sessionStorage.getItem('auth_token')
  const raw = sessionStorage.getItem('auth_user')
  const user = raw ? (JSON.parse(raw) as AuthUser) : null
  return { token, user }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(loadSession)

  function login(token: string, user: AuthUser) {
    // sessionStorage: survives page refresh within the tab, lost on tab close.
    // Better XSS protection than localStorage but weaker than pure in-memory state.
    // Production should use a short-lived in-memory access token + httpOnly/Secure/SameSite
    // refresh-token cookie managed by the server — that's out of scope for this milestone.
    sessionStorage.setItem('auth_token', token)
    sessionStorage.setItem('auth_user', JSON.stringify(user))
    setState({ token, user })
  }

  function logout() {
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    setState({ token: null, user: null })
  }

  return {
    token: state.token,
    user: state.user,
    isAuthenticated: state.token !== null,
    login,
    logout,
  }
}
