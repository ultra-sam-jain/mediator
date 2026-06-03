import { useCallback, useEffect, useState } from 'react'
import { fetchLeads, retryLead } from '../lib/api'
import { Filters } from '../components/Filters'
import { LeadsTable } from '../components/LeadsTable'
import { HousingPanel } from '../components/HousingPanel'
import { SourceCards } from '../components/SourceCards'
import { StatsBar } from '../components/StatsBar'
import type { LeadLog } from '../../lib/types'

interface DashboardPageProps {
  title: string
  initialFilters?: { source?: string; status?: string }
  showSourceFilter?: boolean
  showFailedActions?: boolean
  showWebhookUrls?: boolean
  showHousingPanel?: boolean
}

export function DashboardPage({
  title,
  initialFilters = {},
  showSourceFilter = true,
  showFailedActions = false,
  showWebhookUrls = false,
  showHousingPanel = false,
}: DashboardPageProps) {
  const [rows, setRows] = useState<LeadLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initialFilters.status ?? '')
  const [source, setSource] = useState(initialFilters.source ?? '')
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetchLeads({
      source: source || undefined,
      status: status || undefined,
      search: search || undefined,
    })
      .then((data) => setRows(data.rows))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [source, status, search])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  async function handleRetry(id: string) {
    setRetryingId(id)
    try {
      await retryLead(id)
      load()
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <StatsBar />
      {showHousingPanel && <HousingPanel onSynced={load} />}
      {showWebhookUrls && <SourceCards />}
      <Filters
        search={search}
        status={status}
        source={source}
        showSourceFilter={showSourceFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onSourceChange={setSource}
      />
      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading leads…</p>
      ) : (
        <LeadsTable
          rows={rows}
          showRetry={showFailedActions}
          onRetry={handleRetry}
          retryingId={retryingId}
        />
      )}
    </div>
  )
}
