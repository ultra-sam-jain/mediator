import type { LeadFilters, LeadLog, LeadStats } from './types.js'

const logs: LeadLog[] = []

function matchesFilters(row: LeadLog, filters: LeadFilters): boolean {
  if (filters.source && row.source !== filters.source) return false
  if (filters.status && row.status !== filters.status) return false
  if (filters.search) {
    const q = filters.search.toLowerCase()
    const hay = `${row.name} ${row.phone} ${row.project}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

export function memoryAppendLog(row: LeadLog): LeadLog {
  logs.unshift(row)
  return row
}

export function memoryUpdateStatus(
  id: string,
  status: LeadLog['status'],
  forwardError?: string,
): LeadLog | null {
  const row = logs.find((l) => l.id === id)
  if (!row) return null
  row.status = status
  if (forwardError !== undefined) row.forward_error = forwardError
  return row
}

export function memoryGetLead(id: string): LeadLog | null {
  return logs.find((l) => l.id === id) ?? null
}

export function memoryListLeads(filters: LeadFilters = {}): {
  rows: LeadLog[]
  total: number
} {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50))
  const filtered = logs.filter((row) => matchesFilters(row, filters))
  const start = (page - 1) * limit
  return {
    total: filtered.length,
    rows: filtered.slice(start, start + limit),
  }
}

export function memoryGetStats(): LeadStats {
  const bySource: Record<string, number> = {}
  let success = 0
  let failed = 0
  let pending = 0

  for (const row of logs) {
    bySource[row.source] = (bySource[row.source] ?? 0) + 1
    if (row.status === 'SUCCESS') success++
    else if (row.status === 'FAILED') failed++
    else pending++
  }

  return {
    total: logs.length,
    success,
    failed,
    pending,
    bySource,
  }
}

export function memoryCheckDuplicate(source: string, phone: string, project: string): boolean {
  return logs.some(
    (l) =>
      l.source.toLowerCase() === source.toLowerCase() &&
      l.phone === phone &&
      l.project.toLowerCase() === project.toLowerCase(),
  )
}
