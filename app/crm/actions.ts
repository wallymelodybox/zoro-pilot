'use server'

import { createClient } from '@/lib/supabase/server'

async function getUserOrgId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) throw new Error('Organisation non trouvée')
  return { supabase, orgId: profile.organization_id, userId: user.id }
}

// ══════════════════════════════════════════════════════════════
// CONTACTS
// ══════════════════════════════════════════════════════════════
export async function getContacts() {
  const { supabase, orgId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*, crm_accounts(id, name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (error) return { error: error.message }
  return { data }
}

export async function createContact(formData: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  mobile?: string
  job_title?: string
  department?: string
  account_id?: string
  lead_source?: string
  status?: string
  notes?: string
  tags?: string[]
}) {
  const { supabase, orgId, userId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({
      ...formData,
      organization_id: orgId,
      owner_id: userId,
      created_by: userId,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function updateContact(id: string, updates: Record<string, unknown>) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_contacts')
    .update(updates)
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteContact(id: string) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_contacts')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// ACCOUNTS
// ══════════════════════════════════════════════════════════════
export async function getAccounts() {
  const { supabase, orgId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_accounts')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (error) return { error: error.message }
  return { data }
}

export async function createAccount(formData: {
  name: string
  domain?: string
  industry?: string
  company_size?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  country?: string
  type?: string
  priority?: string
  description?: string
}) {
  const { supabase, orgId, userId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_accounts')
    .insert({
      ...formData,
      organization_id: orgId,
      owner_id: userId,
      created_by: userId,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function updateAccount(id: string, updates: Record<string, unknown>) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_accounts')
    .update(updates)
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAccount(id: string) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_accounts')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// DEALS & PIPELINE
// ══════════════════════════════════════════════════════════════
export async function getDealStages() {
  const { supabase, orgId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_deal_stages')
    .select('*')
    .eq('organization_id', orgId)
    .order('position')
  if (error) return { error: error.message }
  return { data }
}

export async function getDeals() {
  const { supabase, orgId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_deals')
    .select('*, crm_deal_stages(id, name, color, is_won, is_lost), crm_contacts(id, first_name, last_name), crm_accounts(id, name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (error) return { error: error.message }
  return { data }
}

export async function createDeal(formData: {
  title: string
  value?: number
  currency?: string
  stage_id?: string
  contact_id?: string
  account_id?: string
  priority?: string
  expected_close_date?: string
  description?: string
  tags?: string[]
}) {
  const { supabase, orgId, userId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_deals')
    .insert({
      ...formData,
      organization_id: orgId,
      owner_id: userId,
      created_by: userId,
    })
    .select('*, crm_deal_stages(id, name, color, is_won, is_lost), crm_contacts(id, first_name, last_name), crm_accounts(id, name)')
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function updateDeal(id: string, updates: Record<string, unknown>) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_deals')
    .update(updates)
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteDeal(id: string) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_deals')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// ACTIVITIES
// ══════════════════════════════════════════════════════════════
export async function getActivities(filters?: { contact_id?: string; deal_id?: string; account_id?: string }) {
  const { supabase, orgId } = await getUserOrgId()
  let query = supabase
    .from('crm_activities')
    .select('*, crm_contacts(id, first_name, last_name), crm_deals(id, title), crm_accounts(id, name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (filters?.contact_id) query = query.eq('contact_id', filters.contact_id)
  if (filters?.deal_id) query = query.eq('deal_id', filters.deal_id)
  if (filters?.account_id) query = query.eq('account_id', filters.account_id)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export async function createActivity(formData: {
  type: string
  title: string
  description?: string
  contact_id?: string
  deal_id?: string
  account_id?: string
  due_date?: string
  duration_minutes?: number
  outcome?: string
}) {
  const { supabase, orgId, userId } = await getUserOrgId()
  const { data, error } = await supabase
    .from('crm_activities')
    .insert({
      ...formData,
      organization_id: orgId,
      owner_id: userId,
      created_by: userId,
    })
    .select('*, crm_contacts(id, first_name, last_name), crm_deals(id, title), crm_accounts(id, name)')
    .single()
  if (error) return { error: error.message }
  return { data }
}

export async function updateActivity(id: string, updates: Record<string, unknown>) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_activities')
    .update(updates)
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteActivity(id: string) {
  const { supabase } = await getUserOrgId()
  const { error } = await supabase
    .from('crm_activities')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ══════════════════════════════════════════════════════════════
// CRM DASHBOARD STATS
// ══════════════════════════════════════════════════════════════
export async function getCrmStats() {
  const { supabase, orgId } = await getUserOrgId()

  const [contacts, accounts, deals, activities, stages] = await Promise.all([
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('crm_accounts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('crm_deals').select('*, crm_deal_stages(is_won, is_lost)').eq('organization_id', orgId),
    supabase.from('crm_activities').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_completed', false),
    supabase.from('crm_deal_stages').select('*').eq('organization_id', orgId).order('position'),
  ])

  const allDeals = deals.data || []
  const totalPipeline = allDeals
    .filter((d: any) => !d.crm_deal_stages?.is_won && !d.crm_deal_stages?.is_lost)
    .reduce((sum: number, d: any) => sum + (d.value || 0), 0)
  const wonDeals = allDeals.filter((d: any) => d.crm_deal_stages?.is_won)
  const totalWon = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
  const winRate = allDeals.length > 0
    ? Math.round((wonDeals.length / allDeals.filter((d: any) => d.crm_deal_stages?.is_won || d.crm_deal_stages?.is_lost).length) * 100) || 0
    : 0

  return {
    totalContacts: contacts.count || 0,
    totalAccounts: accounts.count || 0,
    totalDeals: allDeals.length,
    pendingActivities: activities.count || 0,
    totalPipeline,
    totalWon,
    winRate,
    stages: stages.data || [],
  }
}
