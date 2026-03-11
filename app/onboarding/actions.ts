'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  getKpisForProfile,
  generateDashboardLayout,
  generateDefaultThresholds,
  type CompanyProfile,
  type QuarterlyObjective,
} from '@/lib/kpi-packs'

export async function completeOnboarding(formData: FormData) {
  try {
    const supabase = await createClient()

    // ── Identity fields
    const userName = formData.get('userName') as string
    const avatarUrl = formData.get('avatarUrl') as string
    const orgName = formData.get('orgName') as string
    const logoUrl = formData.get('logoUrl') as string

    // ── DG cockpit fields
    const companyProfile = (formData.get('companyProfile') as CompanyProfile) || null
    const subProfile = formData.get('subProfile') as string | null
    const quarterlyObjective = (formData.get('quarterlyObjective') as QuarterlyObjective) || null
    const selectedKpisRaw = formData.get('selectedKpis') as string
    const selectedKpiIds: string[] = selectedKpisRaw ? JSON.parse(selectedKpisRaw) : []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autorisé")

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) throw new Error("Organisation non trouvée")

    // ── Generate dashboard config from selections
    let dashboardLayout = {}
    let kpiThresholds = {}

    if (companyProfile && quarterlyObjective && selectedKpiIds.length > 0) {
      const allKpis = getKpisForProfile(companyProfile)
      const selectedKpis = allKpis.filter(k => selectedKpiIds.includes(k.id))
      dashboardLayout = generateDashboardLayout(selectedKpis, quarterlyObjective)
      kpiThresholds = generateDefaultThresholds(selectedKpis)
    }

    // 1. Update Organization with cockpit config
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        name: orgName,
        logo_url: logoUrl || null,
        setup_completed: true,
        company_profile: companyProfile,
        company_sub_profile: subProfile ? { id: subProfile } : {},
        quarterly_objective: quarterlyObjective,
        selected_kpis: selectedKpiIds,
        dashboard_layout: dashboardLayout,
        kpi_thresholds: kpiThresholds,
        dg_onboarding_completed: true,
      })
      .eq('id', profile.organization_id)

    if (orgError) throw orgError

    // 2. Update Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: userName,
        avatar_url: avatarUrl || null,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    revalidatePath('/', 'layout')
  } catch (error: any) {
    console.error('completeOnboarding error:', error)
    return { error: error.message || "Une erreur est survenue lors de la configuration." }
  }
  
  redirect('/')
}
