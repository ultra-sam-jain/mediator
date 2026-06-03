export type LeadStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export interface ParsedLead {
  name: string
  phone: string
  project: string
  budget: string
  email: string
  propertyType: string
  intent: string
}

export interface LeadLog extends ParsedLead {
  id: string
  timestamp: string
  source: string
  status: LeadStatus
  raw_payload: string
  forward_error?: string
}

export interface LeadFilters {
  source?: string
  status?: LeadStatus
  search?: string
  page?: number
  limit?: number
}

export interface LeadStats {
  total: number
  success: number
  failed: number
  pending: number
  bySource: Record<string, number>
}
