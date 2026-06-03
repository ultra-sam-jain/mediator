import { createHmac } from 'crypto'
import { processIncomingLead } from '../dataService.js'
import { getHousingCredentials, getHousingPullUrls } from './housingConfig.js'

export interface HousingSyncResult {
  ok: boolean
  imported: number
  failed: number
  message: string
  details?: string
}

function extractLeadRecords(payload: unknown): Record<string, unknown>[] {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> =>
        item != null && typeof item === 'object' && !Array.isArray(item),
    )
  }
  if (typeof payload !== 'object') return []

  const obj = payload as Record<string, unknown>
  for (const key of ['leads', 'data', 'results', 'records', 'items']) {
    const nested = obj[key]
    if (Array.isArray(nested)) {
      return extractLeadRecords(nested)
    }
  }

  if (obj.Mobile_Number || obj.mobile || obj.phone || obj.Name || obj.name) {
    return [obj]
  }

  return []
}

function hintForStatus(status: number, bodyText: string): string {
  if (status === 403 || bodyText.includes('Access Denied')) {
    return (
      'Housing blocked the request (HTTP 403). Ensure Profile ID and Encryption Key are correct and that Housing is not IP-blocking the request.'
    )
  }
  if (status === 422 || bodyText.includes('change you wanted was rejected')) {
    return (
      'Housing received the request but rejected the parameters (HTTP 422). Check date formats or hashing query values.'
    )
  }
  return 'Housing pull API did not return leads. Check credentials or contact support.'
}

async function fetchHousingLeadsFromUrl(
  baseUrl: string,
  creds: { profileId: string; encryptionKey: string },
): Promise<{
  ok: boolean
  status: number
  payload: unknown
  bodyText: string
  url: string
}> {
  const t = Math.floor(Date.now() / 1000)
  const hash = createHmac('sha256', creds.encryptionKey).update(String(t)).digest('hex')
  
  // start date is 2 days ago (minus 1 minute to prevent date difference > 2 days validation errors), end date is now
  const startTime = Math.floor((Date.now() - (2 * 24 * 60 * 60 * 1000 - 60000)) / 1000)
  const endTime = Math.floor(Date.now() / 1000)

  // Append query parameters to the URL
  const urlObj = new URL(baseUrl)
  urlObj.searchParams.set('start_date', String(startTime))
  urlObj.searchParams.set('end_date', String(endTime))
  urlObj.searchParams.set('current_time', String(t))
  urlObj.searchParams.set('hash', hash)
  urlObj.searchParams.set('id', creds.profileId)

  const fullUrl = urlObj.toString()

  const headers: Record<string, string> = {
    'cache-control': 'no-cache',
    'Accept': 'application/json',
  }

  const res = await fetch(fullUrl, {
    method: 'GET',
    headers,
  })

  const bodyText = await res.text()
  let payload: unknown = bodyText
  try {
    payload = JSON.parse(bodyText) as unknown
  } catch {
    /* plain text */
  }

  return { ok: res.ok, status: res.status, payload, bodyText, url: fullUrl }
}

async function fetchHousingLeads(): Promise<{
  ok: boolean
  status: number
  payload: unknown
  bodyText: string
  attempts: string[]
}> {
  const creds = getHousingCredentials()
  if (!creds) {
    return {
      ok: false,
      status: 0,
      payload: null,
      bodyText: 'Missing credentials',
      attempts: [],
    }
  }

  const attempts: string[] = []
  let last = {
    ok: false,
    status: 0,
    payload: null as unknown,
    bodyText: '',
    url: '',
  }

  for (const url of getHousingPullUrls()) {
    const result = await fetchHousingLeadsFromUrl(url, creds)
    attempts.push(`${url} → HTTP ${result.status}`)
    last = result
    if (result.ok) {
      return {
        ok: true,
        status: result.status,
        payload: result.payload,
        bodyText: result.bodyText,
        attempts,
      }
    }
  }

  return {
    ok: false,
    status: last.status,
    payload: last.payload,
    bodyText: last.bodyText,
    attempts,
  }
}

export async function syncHousingLeadsFromApi(): Promise<HousingSyncResult> {
  if (!getHousingCredentials()) {
    return {
      ok: false,
      imported: 0,
      failed: 0,
      message:
        'Set HOUSING_PROFILE_ID and HOUSING_ENCRYPTION_KEY in Vercel env, then redeploy.',
    }
  }

  const fetchResult = await fetchHousingLeads()
  if (!fetchResult.ok) {
    const hint = hintForStatus(fetchResult.status, fetchResult.bodyText)
    return {
      ok: false,
      imported: 0,
      failed: 0,
      message: hint,
      details: [
        ...fetchResult.attempts,
        `Last response: HTTP ${fetchResult.status}`,
        fetchResult.bodyText.slice(0, 200),
      ].join('\n'),
    }
  }

  const records = extractLeadRecords(fetchResult.payload)
  if (records.length === 0) {
    return {
      ok: true,
      imported: 0,
      failed: 0,
      message:
        'API responded OK but no lead records were parsed. Ask Housing for a sample response JSON.',
      details:
        typeof fetchResult.payload === 'string'
          ? fetchResult.payload.slice(0, 300)
          : JSON.stringify(fetchResult.payload).slice(0, 300),
    }
  }

  let imported = 0
  let failed = 0

  for (const record of records) {
    const result = await processIncomingLead('housing', record)
    if (result.status === 'SUCCESS' || result.status === 'PENDING') {
      imported += 1
    } else {
      failed += 1
    }
  }

  return {
    ok: failed === 0,
    imported,
    failed,
    message: `Processed ${records.length} lead(s) from Housing API.`,
  }
}
