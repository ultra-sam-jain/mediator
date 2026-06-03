import type { ParsedLead } from './types.js'

function pickString(body: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = body[key]
    if (value != null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

export function parseLeadData(body: Record<string, unknown>): ParsedLead {
  return {
    name: pickString(body, ['Name', 'name', 'customer_name', 'Customer_Name']),
    phone: pickString(body, [
      'Mobile_Number',
      'mobile',
      'phone',
      'Phone',
      'contact_number',
      'Contact_Number',
    ]),
    project: pickString(body, ['Project_Name', 'project', 'project_name', 'Project']),
    budget: pickString(body, ['Budget', 'budget', 'price_range']),
    email: pickString(body, ['Email_Id', 'email', 'Email']),
    propertyType: pickString(body, ['Property_Type', 'property_type', 'propertyType']),
    intent: pickString(body, ['Intent', 'intent', 'lead_intent']),
  }
}

export async function readRequestBody(
  rawBody: string | undefined,
  contentType: string | undefined,
): Promise<Record<string, unknown>> {
  if (!rawBody?.trim()) return {}

  const ct = (contentType ?? '').toLowerCase()
  if (ct.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
  }

  if (ct.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody)
    const out: Record<string, unknown> = {}
    params.forEach((value, key) => {
      out[key] = value
    })
    return out
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    const params = new URLSearchParams(rawBody)
    if ([...params.keys()].length > 0) {
      const out: Record<string, unknown> = {}
      params.forEach((value, key) => {
        out[key] = value
      })
      return out
    }
  }

  return {}
}
