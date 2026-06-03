/**
 * Data layer: Supabase (preferred) → Google Sheets GAS → in-memory fallback.
 */
import { isSupabaseConfigured } from './supabaseClient.js'
import * as sheetService from './sheetService.js'
import * as supabaseService from './supabaseService.js'
import type { LeadFilters, LeadLog, LeadStats } from './types.js'

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

export async function checkLeadDuplicate(
  source: string,
  phone: string,
  project: string,
): Promise<boolean> {
  return store().checkLeadDuplicate(source, phone, project)
}
