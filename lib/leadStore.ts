/**
 * Data layer: Supabase (preferred) → Google Sheets GAS → in-memory fallback.
 */
import { isSupabaseConfigured } from './supabaseClient'
import * as sheetService from './sheetService'
import * as supabaseService from './supabaseService'
import type { LeadFilters, LeadLog, LeadStats } from './types'

function store() {
  return isSupabaseConfigured() ? supabaseService : sheetService
}

export async function appendLogRow(row: LeadLog): Promise<LeadLog> {
  return store().appendLogRow(row)
}

export async function updateLogStatus(
  id: string,
  status: LeadLog['status'],
  forwardError?: string,
): Promise<LeadLog | null> {
  return store().updateLogStatus(id, status, forwardError)
}

export async function getLeadById(id: string): Promise<LeadLog | null> {
  return store().getLeadById(id)
}

export async function listLeads(filters: LeadFilters = {}) {
  return store().listLeads(filters)
}

export async function getStats(): Promise<LeadStats> {
  return store().getStats()
}
