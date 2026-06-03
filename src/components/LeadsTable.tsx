import type { LeadLog } from '../../lib/types'

interface LeadsTableProps {
  rows: LeadLog[]
  showRetry?: boolean
  onRetry?: (id: string) => void
  retryingId?: string | null
}

function statusClass(status: LeadLog['status']) {
  if (status === 'SUCCESS') return 'text-emerald-400'
  if (status === 'FAILED') return 'text-red-400'
  return 'text-amber-400'
}

export function LeadsTable({ rows, showRetry, onRetry, retryingId }: LeadsTableProps) {
  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-slate-500">No leads yet.</p>
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Project</th>
            <th className="px-3 py-2">Status</th>
            {showRetry && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-800/80">
              <td className="px-3 py-2 text-slate-400">
                {new Date(row.timestamp).toLocaleString()}
              </td>
              <td className="px-3 py-2">{row.source}</td>
              <td className="px-3 py-2">{row.name || '—'}</td>
              <td className="px-3 py-2">{row.phone || '—'}</td>
              <td className="px-3 py-2">{row.project || '—'}</td>
              <td className={`px-3 py-2 font-medium ${statusClass(row.status)}`}>
                {row.status}
                {row.forward_error && (
                  <span className="mt-0.5 block text-xs font-normal text-red-300/80">
                    {row.forward_error}
                  </span>
                )}
              </td>
              {showRetry && (
                <td className="px-3 py-2">
                  <button
                    type="button"
                    disabled={retryingId === row.id}
                    onClick={() => onRetry?.(row.id)}
                    className="rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600 disabled:opacity-50"
                  >
                    {retryingId === row.id ? 'Retrying…' : 'Retry'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
