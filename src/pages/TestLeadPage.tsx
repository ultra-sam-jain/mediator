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
  const [payloadText, setPayloadText] = useState(JSON.stringify(samplePayload, null, 2))
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  async function submit() {
    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(payloadText)
      setJsonError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const res = await sendTestLead(source, parsed)
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
          disabled={loading || !!jsonError}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send test lead'}
        </button>
      </div>
      <div className="mt-4">
        <label className="block text-xs font-medium text-slate-400 mb-1">
          JSON Payload (Edit as needed):
        </label>
        <textarea
          value={payloadText}
          onChange={(e) => {
            setPayloadText(e.target.value)
            try {
              JSON.parse(e.target.value)
              setJsonError(null)
            } catch (err) {
              setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
            }
          }}
          rows={10}
          className={`w-full font-mono text-xs rounded-xl border p-4 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 ${
            jsonError ? 'border-red-500/80 focus:ring-red-500/30' : 'border-slate-800 focus:ring-emerald-500/30'
          }`}
        />
        {jsonError && (
          <p className="mt-1 text-xs text-red-400">
            {jsonError}
          </p>
        )}
      </div>
      {result && (
        <p className="mt-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
          {result}
        </p>
      )}
    </div>
  )
}
