import { getSupabaseAdmin } from './supabaseClient.js'
import type { LeadFilters, LeadLog, LeadStats } from './types.js'

interface LeadRow {
  id: string
  created_at: string
  source: string
  name: string
  phone: string
  project: string
  budget: string
  email: string
  property_type: string
  intent: string
  status: LeadLog['status']
  raw_payload: unknown
  forward_error: string | null
}

function rowToLead(row: LeadRow): LeadLog {
  const raw =
    typeof row.raw_payload === 'string'
      ? row.raw_payload
      : JSON.stringify(row.raw_payload ?? {})

  return {
    id: row.id,
    timestamp: row.created_at,
    source: row.source,
    name: row.name ?? '',
    phone: row.phone ?? '',
    project: row.project ?? '',
    budget: row.budget ?? '',
    email: row.email ?? '',
    propertyType: row.property_type ?? '',
    intent: row.intent ?? '',
    status: row.status,
    raw_payload: raw,
    forward_error: row.forward_error ?? undefined,
  }
}

function leadToInsert(row: LeadLog) {
  let rawPayload: unknown
  try {
    rawPayload = JSON.parse(row.raw_payload)
  } catch {
    rawPayload = { _raw: row.raw_payload }
  }

  return {
    id: row.id,
    created_at: row.timestamp,
    source: row.source,
    name: row.name,
    phone: row.phone,
    project: row.project,
    budget: row.budget,
    email: row.email,
    property_type: row.propertyType,
    intent: row.intent,
    status: row.status,
    raw_payload: rawPayload,
    forward_error: row.forward_error ?? null,
  }
}

export async function appendLogRow(row: LeadLog): Promise<LeadLog> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('leads').insert(leadToInsert(row))
  if (error) throw new Error(error.message)
  return row
}

export async function updateLogStatus(
  id: string,
  status: LeadLog['status'],
  forwardError?: string,
): Promise<LeadLog | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('leads')
    .update({
      status,
      forward_error: forwardError ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data ? rowToLead(data as LeadRow) : null
}

export async function getLeadById(id: string): Promise<LeadLog | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToLead(data as LeadRow) : null
}

export async function listLeads(filters: LeadFilters = {}): Promise<{
  rows: LeadLog[]
  total: number
}> {
  const supabase = getSupabaseAdmin()
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.source) query = query.eq('source', filters.source)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%_,]/g, '')
    if (term) {
      const pattern = `%${term}%`
      query = query.or(
        `name.ilike.${pattern},phone.ilike.${pattern},project.ilike.${pattern}`,
      )
    }
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw new Error(error.message)

  return {
    total: count ?? 0,
    rows: (data ?? []).map((r) => rowToLead(r as LeadRow)),
  }
}

export async function getStats(): Promise<LeadStats> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('leads').select('status, source')
  if (error) throw new Error(error.message)

  const stats: LeadStats = {
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    bySource: {},
  }

  for (const row of data ?? []) {
    stats.total++
    const source = row.source as string
    stats.bySource[source] = (stats.bySource[source] ?? 0) + 1
    if (row.status === 'SUCCESS') stats.success++
    else if (row.status === 'FAILED') stats.failed++
    else stats.pending++
  }

  return stats
}
