import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'All Leads' },
  { to: '/housing', label: 'Housing' },
  { to: '/magicbricks', label: 'MagicBricks' },
  { to: '/failed', label: 'Failed' },
  { to: '/test', label: 'Test Webhook' },
]

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Lead Redirector</h1>
          <p className="mt-1 text-sm text-slate-400">
            Permanent webhook URLs for portals — update GAS destinations in Vercel env only.
          </p>
          <nav className="mt-4 flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm transition ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
