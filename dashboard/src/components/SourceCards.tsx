import { webhookUrl } from '../lib/api'

const sources = [
  { id: 'housing', label: 'Housing.com' },
  { id: 'magicbricks', label: 'MagicBricks' },
]

export function SourceCards() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {sources.map((s) => {
        const url = webhookUrl(s.id)
        return (
          <div
            key={s.id}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
          >
            <h3 className="font-medium text-slate-200">{s.label}</h3>
            <p className="mt-1 text-xs text-slate-500">Give this URL to the portal (never changes):</p>
            <code className="mt-2 block break-all rounded-lg bg-slate-950 px-3 py-2 text-xs text-emerald-300">
              {url}
            </code>
          </div>
        )
      })}
    </div>
  )
}
