import type { LeadLog, LeadStats } from '../../lib/types'

function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, credentials: 'include' })
}

export interface LeadsResponse {
  rows: LeadLog[]
  total: number
}

export async function fetchStats(): Promise<LeadStats> {
  const res = await apiFetch('/api/stats')
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json() as Promise<LeadStats>
}

export async function fetchLeads(params: {
  source?: string
  status?: string
  search?: string
  page?: number
}): Promise<LeadsResponse> {
  const q = new URLSearchParams()
  if (params.source) q.set('source', params.source)
  if (params.status) q.set('status', params.status)
  if (params.search) q.set('search', params.search)
  if (params.page) q.set('page', String(params.page))
  const res = await apiFetch(`/api/leads?${q}`)
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Failed to load leads')
  return res.json() as Promise<LeadsResponse>
}

export async function retryLead(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch('/api/retry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  return res.json() as Promise<{ ok: boolean; error?: string }>
}

export async function sendTestLead(
  source: string,
  payload: Record<string, string>,
): Promise<{ logId: string; status: string; error?: string }> {
  const res = await apiFetch(`/api/webhook?source=${encodeURIComponent(source)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Webhook request failed')
  return res.json() as Promise<{ logId: string; status: string; error?: string }>
}

export function webhookUrl(source: string): string {
  const base =
    import.meta.env.VITE_PUBLIC_APP_URL?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/api/webhook?source=${encodeURIComponent(source)}`
}
