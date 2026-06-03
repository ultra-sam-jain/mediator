import type { LeadFilters, LeadLog, LeadStats } from './types'
import {
  memoryAppendLog,
  memoryGetLead,
  memoryGetStats,
  memoryListLeads,
  memoryUpdateStatus,
} from './memoryStore'

const LOGS_GAS_URL = () => process.env.LOGS_GAS_URL?.trim() ?? ''

function useMemory(): boolean {
  return !LOGS_GAS_URL()
}

async function gasRequest<T>(payload: Record<string, unknown>): Promise<T> {
  const url = LOGS_GAS_URL()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(text || `Logs GAS returned ${res.status}`)
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return { ok: true } as T
  }
}

export async function appendLogRow(row: LeadLog): Promise<LeadLog> {
  memoryAppendLog(row)
  if (!useMemory()) {
    await gasRequest({ action: 'append', lead: row })
  }
  return row
}

export async function updateLogStatus(
  id: string,
  status: LeadLog['status'],
  forwardError?: string,
): Promise<LeadLog | null> {
  const updated = memoryUpdateStatus(id, status, forwardError)
  if (!useMemory()) {
    await gasRequest({
      action: 'updateStatus',
      id,
      status,
      forward_error: forwardError ?? '',
    })
  }
  return updated
}

export async function getLeadById(id: string): Promise<LeadLog | null> {
  const cached = memoryGetLead(id)
  if (cached || useMemory()) return cached

  const data = await gasRequest<{ lead: LeadLog | null }>({ action: 'get', id })
  return data.lead ?? null
}

export async function listLeads(filters: LeadFilters = {}): Promise<{
  rows: LeadLog[]
  total: number
}> {
  if (useMemory()) return memoryListLeads(filters)

  try {
    return await gasRequest<{ rows: LeadLog[]; total: number }>({
      action: 'list',
      filters,
    })
  } catch {
    return memoryListLeads(filters)
  }
}

export async function getStats(): Promise<LeadStats> {
  if (useMemory()) return memoryGetStats()

  try {
    return await gasRequest<LeadStats>({ action: 'stats' })
  } catch {
    return memoryGetStats()
  }
}
