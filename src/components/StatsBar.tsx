import { useEffect, useState } from 'react'
import { fetchStats } from '../lib/api'
import type { LeadStats } from '../../lib/types'

export function StatsBar() {
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  if (!stats) {
    return <p className="text-sm text-slate-500">Loading stats…</p>
  }

  const cards = [
    { label: 'Total', value: stats.total },
    { label: 'Success', value: stats.success },
    { label: 'Failed', value: stats.failed },
    { label: 'Pending', value: stats.pending },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
