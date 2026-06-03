import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface AuthState {
  loading: boolean
  authenticated: boolean
  configured: boolean
}

interface AuthContextValue extends AuthState {
  login: (password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchMe(): Promise<{ authenticated: boolean; configured: boolean }> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (!res.ok) return { authenticated: false, configured: true }
  return res.json() as Promise<{ authenticated: boolean; configured: boolean }>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    configured: true,
  })

  const refresh = useCallback(async () => {
    try {
      const data = await fetchMe()
      setState({
        loading: false,
        authenticated: data.authenticated,
        configured: data.configured,
      })
    } catch {
      setState({ loading: false, authenticated: false, configured: true })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(
    async (password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        return { ok: false, error: data.error ?? 'Login failed' }
      }
      await refresh()
      return { ok: true }
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setState((s) => ({ ...s, authenticated: false }))
  }, [])

  const value = useMemo(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
