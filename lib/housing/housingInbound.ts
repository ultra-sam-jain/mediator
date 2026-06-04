import type { IncomingHttpHeaders } from 'http'
import { readRequestBody } from '../parseLeadData.js'
import { getHousingCredentials } from './housingConfig.js'
import {
  decryptHousingCiphertext,
  HOUSING_ENCRYPTED_FIELD_KEYS,
} from './housingDecrypt.js'

export interface HousingParseResult {
  body: Record<string, unknown>
  decrypted: boolean
  warning?: string
}

function flattenHousingLead(body: Record<string, unknown>): Record<string, unknown> {
  for (const key of ['lead', 'Lead', 'lead_data', 'customer', 'Customer', 'data', 'Data', 'payload', 'response', 'Response']) {
    const nested = body[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return { ...body, ...(nested as Record<string, unknown>) }
    }
  }
  return body
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return flattenHousingLead(parsed as Record<string, unknown>)
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0]
      if (first && typeof first === 'object') {
        return flattenHousingLead(first as Record<string, unknown>)
      }
    }
  } catch {
    return null
  }
  return null
}

function tryDecryptIntoBody(
  encrypted: string,
  encryptionKey: string,
): Record<string, unknown> | null {
  const plain = decryptHousingCiphertext(encrypted, encryptionKey)
  if (!plain) return null
  return parseJsonObject(plain)
}

export function verifyHousingProfile(
  body: Record<string, unknown>,
  headers: IncomingHttpHeaders,
): { ok: boolean; warning?: string } {
  const expected = getHousingCredentials()?.profileId
  if (!expected) return { ok: true }

  const headerId =
    headers['x-profile-id'] ??
    headers['profile-id'] ??
    headers['x-housing-profile-id']
  const bodyId =
    body.profile_id ??
    body.profileId ??
    body.Profile_Id ??
    body.housing_profile_id

  const received = String(headerId ?? bodyId ?? '').trim()
  if (!received) return { ok: true }

  if (received !== expected) {
    return {
      ok: false,
      warning: `Profile ID mismatch (expected ${expected}, got ${received})`,
    }
  }
  return { ok: true }
}

export async function parseHousingBody(
  rawBody: string | undefined,
  contentType: string | undefined,
  headers: IncomingHttpHeaders = {},
): Promise<HousingParseResult> {
  let body = await readRequestBody(rawBody, contentType)
  body = flattenHousingLead(body)

  const creds = getHousingCredentials()
  if (!creds) {
    return { body, decrypted: false }
  }

  for (const field of HOUSING_ENCRYPTED_FIELD_KEYS) {
    const value = body[field]
    if (typeof value === 'string' && value.length > 16) {
      const decrypted = tryDecryptIntoBody(value, creds.encryptionKey)
      if (decrypted) {
        return { body: decrypted, decrypted: true }
      }
    }
  }

  if (Object.keys(body).length === 0 && rawBody?.trim()) {
    const trimmed = rawBody.trim()
    const decrypted = tryDecryptIntoBody(trimmed, creds.encryptionKey)
    if (decrypted) {
      return { body: decrypted, decrypted: true }
    }
  }

  const profileCheck = verifyHousingProfile(body, headers)
  if (!profileCheck.ok) {
    return { body, decrypted: false, warning: profileCheck.warning }
  }

  return { body, decrypted: false }
}
