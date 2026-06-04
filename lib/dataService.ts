import { randomUUID } from 'crypto'
import { forwardToDestination } from './forwardService.js'
import { parseLeadData } from './parseLeadData.js'
import { getSource } from './sources.js'
import * as leadStore from './leadStore.js'
import type { LeadFilters, LeadLog, LeadStats, ParsedLead } from './types.js'

export function createLogRow(
  source: string,
  parsed: ParsedLead,
  rawPayload: Record<string, unknown>,
): LeadLog {
  let timestamp = new Date().toISOString()
  const timeKeys = [
    'lead_time', 'leadTime', 'Lead_Time', 'LeadTime',
    'created_at', 'createdAt',
    'date', 'Date',
    'time', 'Time',
    'dateTime', 'DateTime',
    'timestamp', 'Timestamp',
    'lead_date', 'leadDate',
    'contacted_at', 'Contacted_At'
  ]
  for (const key of timeKeys) {
    const val = rawPayload[key]
    if (val) {
      if (typeof val === 'number') {
        const dateObj = new Date(val > 9999999999 ? val : val * 1000)
        if (!isNaN(dateObj.getTime())) {
          timestamp = dateObj.toISOString()
          break
        }
      } else if (typeof val === 'string' && val.trim() !== '') {
        const num = Number(val)
        if (!isNaN(num) && val.trim() !== '' && num > 0) {
          const dateObj = new Date(num > 9999999999 ? num : num * 1000)
          if (!isNaN(dateObj.getTime())) {
            timestamp = dateObj.toISOString()
            break
          }
        } else {
          const dateObj = new Date(val)
          if (!isNaN(dateObj.getTime())) {
            timestamp = dateObj.toISOString()
            break
          }
        }
      }
    }
  }

  return {
    id: randomUUID(),
    timestamp,
    source,
    status: 'PENDING',
    raw_payload: JSON.stringify(rawPayload),
    ...parsed,
  }
}

export async function logLead(row: LeadLog): Promise<LeadLog> {
  return leadStore.appendLogRow(row)
}

export async function updateLeadStatus(
  id: string,
  status: LeadLog['status'],
  forwardError?: string,
): Promise<void> {
  await leadStore.updateLogStatus(id, status, forwardError)
}

export async function forwardLead(
  sourceKey: string,
  rawPayload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const source = getSource(sourceKey)
  if (!source?.destinationUrl) {
    return { ok: false, error: `No destination URL configured for source "${sourceKey}"` }
  }

  // Parse fields using our central parser to guarantee compatibility with mapped Google Apps Script keys
  const parsed = parseLeadData(rawPayload)
  const mappedPayload = {
    ...rawPayload,
    Name: parsed.name,
    Mobile_Number: parsed.phone,
    Project_Name: parsed.project,
    Budget: parsed.budget,
    Email_Id: parsed.email,
    Property_Type: parsed.propertyType,
    Intent: parsed.intent,
  }

  const result = await forwardToDestination(source.destinationUrl, mappedPayload)
  return result.ok ? { ok: true } : { ok: false, error: result.error ?? result.body }
}

export async function processIncomingLead(
  sourceKey: string,
  rawPayload: Record<string, unknown>,
): Promise<{ logId: string; status: LeadLog['status']; error?: string }> {
  const parsed = parseLeadData(rawPayload)

  if (parsed.phone && parsed.project) {
    const isDuplicate = await leadStore.checkLeadDuplicate(sourceKey, parsed.phone, parsed.project)
    if (isDuplicate) {
      return { logId: '', status: 'SUCCESS', error: 'Duplicate lead skipped' }
    }
  }

  const row = await logLead(createLogRow(sourceKey, parsed, rawPayload))

  const forward = await forwardLead(sourceKey, rawPayload)
  if (forward.ok) {
    await updateLeadStatus(row.id, 'SUCCESS')
    return { logId: row.id, status: 'SUCCESS' }
  }

  await updateLeadStatus(row.id, 'FAILED', forward.error)
  return { logId: row.id, status: 'FAILED', error: forward.error }
}

export async function retryLead(id: string): Promise<{
  ok: boolean
  status: LeadLog['status']
  error?: string
}> {
  const row = await leadStore.getLeadById(id)
  if (!row) return { ok: false, status: 'FAILED', error: 'Lead not found' }

  let rawPayload: Record<string, unknown>
  try {
    rawPayload = JSON.parse(row.raw_payload) as Record<string, unknown>
  } catch {
    return { ok: false, status: 'FAILED', error: 'Invalid stored payload' }
  }

  await updateLeadStatus(id, 'PENDING')
  const forward = await forwardLead(row.source, rawPayload)
  if (forward.ok) {
    await updateLeadStatus(id, 'SUCCESS')
    return { ok: true, status: 'SUCCESS' }
  }

  await updateLeadStatus(id, 'FAILED', forward.error)
  return { ok: false, status: 'FAILED', error: forward.error }
}

export async function getLeads(filters: LeadFilters) {
  return leadStore.listLeads(filters)
}

export async function getStats(): Promise<LeadStats> {
  return leadStore.getStats()
}
