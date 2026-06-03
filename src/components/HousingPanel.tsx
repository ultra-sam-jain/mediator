import { useCallback, useEffect, useState } from 'react'
import { fetchHousingStatus, syncHousingLeads, webhookUrl } from '../lib/api'

interface HousingPanelProps {
  onSynced?: () => void
}

export function HousingPanel({ onSynced }: HousingPanelProps) {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [profileMask, setProfileMask] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadStatus = useCallback(() => {
    fetchHousingStatus()
      .then((s) => {
        setConfigured(s.configured)
        setProfileMask(s.profileId)
      })
      .catch(() => setConfigured(false))
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  async function handleSync() {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await syncHousingLeads()
      setMessage(
        res.details ? `${res.message}\n\n${res.details}` : res.message,
      )
      if (res.imported > 0) onSynced?.()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="text-sm font-medium text-slate-200">Housing.com credentials</h3>
      <p className="mt-1 text-xs text-slate-500">
        Webhook URL (paste in Housing dashboard — never changes):
      </p>
      <code className="mt-2 block break-all rounded-lg bg-slate-950 px-3 py-2 text-xs text-emerald-300">
        {webhookUrl('housing')}
      </code>

      {configured === false && (
        <p className="mt-3 text-xs text-amber-400">
          Add <code className="text-amber-200">HOUSING_PROFILE_ID</code> and{' '}
          <code className="text-amber-200">HOUSING_ENCRYPTION_KEY</code> in Vercel →
          Environment Variables, then redeploy. Used to decrypt encrypted webhook payloads.
        </p>
      )}
      {configured && profileMask && (
        <p className="mt-3 text-xs text-slate-400">
          Profile ID configured: <span className="text-slate-300">{profileMask}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || configured === false}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Pull leads (Housing API)'}
        </button>
        <span className="text-xs text-slate-500">
          Pull often returns HTTP 422 (unknown API format). Test leads locally via{' '}
          <a href="/test" className="text-emerald-400 underline">
            Test Webhook
          </a>
          .
        </span>
      </div>

      {message && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400">
          {message}
        </pre>
      )}
    </div>
  )
}
