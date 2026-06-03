import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { loading, authenticated, configured } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Checking session…
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-amber-800 bg-amber-950/40 p-6 text-amber-100">
          <h1 className="text-lg font-semibold">Admin password not set</h1>
          <p className="mt-2 text-sm text-amber-200/80">
            Add <code className="text-amber-100">ADMIN_PASSWORD</code> (at least 8 characters) in
            Vercel environment variables, then redeploy.
          </p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
