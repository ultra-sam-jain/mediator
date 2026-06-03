import { useState } from 'react'
import { sendTestLead, webhookUrl } from '../lib/api'

const samplePayload = {
  Name: 'Test User',
  Mobile_Number: '9876543210',
  Project_Name: 'Sample Project',
  Budget: '50L - 1Cr',
  Property_Type: 'Apartment',
  Intent: 'Buy',
  Email_Id: 'test@example.com',
}

export function TestLeadPage() {
  const [source, setSource] = useState('housing')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    setResult(null)
    try {
      const res = await sendTestLead(source, samplePayload)
      setResult(
        res.error
          ? `Logged ${res.logId} — forward FAILED: ${res.error}`
          : `Success — log ${res.logId}, status ${res.status}`,
      )
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Test webhook</h2>
      <p className="mt-2 text-sm text-slate-400">
        Sends a sample Housing-style payload through the same pipeline portals use.
      </p>
      <p className="mt-4 text-xs text-slate-500">
        Target: <code className="text-emerald-300">{webhookUrl(source)}</code>
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="housing">housing</option>
          <option value="magicbricks">magicbricks</option>
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send test lead'}
        </button>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
        {JSON.stringify(samplePayload, null, 2)}
      </pre>
      {result && (
        <p className="mt-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
          {result}
        </p>
      )}
    </div>
  )
}
