'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

async function ensureProfile(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Utilisateur non authentifié.' }
  }

  const email = user.email || `user-${user.id}@example.com`
  const name = user.user_metadata.full_name || (email.includes('@') ? email.split('@')[0] : email)

  // ── 1. SUPER ADMIN — accès inconditionnel
  if (email === 'menannzoro@gmail.com') {
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email,
        name,
        role: 'Propriétaire',
        rbac_role: 'super_admin',
        manager_id: null,
      })
    if (upsertError) return { error: upsertError.message }
    return { success: true }
  }

  // ── 2. UTILISATEUR EXISTANT — via RPC SECURITY DEFINER (bypass RLS)
  const { data: profileRows } = await supabase.rpc('get_my_profile')
  const existingProfile = profileRows?.[0] ?? null

  if (existingProfile && existingProfile.organization_id) {
    return { success: true }
  }

  // Profil admin/executive sans organization_id : auto-réparation
  if (existingProfile && (existingProfile.rbac_role === 'admin' || existingProfile.rbac_role === 'executive')) {
    const { data: orgId } = await supabase.rpc('get_my_org_from_members')

    if (orgId) {
      const { error: repairError } = await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('id', user.id)
      if (repairError) return { error: repairError.message }
      return { success: true }
    }

    await supabase.auth.signOut()
    return { error: "Votre compte est incomplet. Contactez l'administrateur pour le réactiver." }
  }

  // ── 3. NOUVELLE INVITATION — premier login d'un membre invité
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('invited_email', email)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    await supabase.auth.signOut()
    return { error: "Accès refusé. Votre compte doit être créé par un administrateur ou via une invitation valide." }
  }

  // Consommer l'invitation (atomic: is_used=false guard prevents race condition)
  const { count: updatedCount } = await supabase
    .from('invites')
    .update({ is_used: true, used_at: new Date().toISOString(), used_by: user.id })
    .eq('id', invite.id)
    .eq('is_used', false)
    .select('*', { count: 'exact', head: true })

  if (!updatedCount || updatedCount === 0) {
    await supabase.auth.signOut()
    return { error: "Cette invitation a déjà été utilisée." }
  }

  // Créer/mettre à jour le profil
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email,
      name,
      role: invite.role_assigned,
      avatar_url: null,
      team_id: null,
      rbac_role: invite.rbac_role_assigned || 'member',
      organization_id: invite.organization_id,
      manager_id: invite.created_by,
    })

  if (upsertError) return { error: upsertError.message }

  return { success: true }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // On passe le MÊME client pour que la session soit partagée
  const ensured = await ensureProfile(supabase)
  if ('error' in ensured && ensured.error) {
    redirect(`/login?error=${encodeURIComponent(ensured.error)}`)
  }

  revalidatePath('/', 'layout')

  // Validate next parameter to prevent open redirect attacks
  const next = formData.get('next') as string
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    redirect(next)
  }

  redirect('/')
}

// ── signup et signInWithOAuth sont désactivés.
// La création de comptes se fait exclusivement via :
//   • Super Admin (BO) → crée les comptes DG
//   • DG → invite les membres de son organisation
// Aucune inscription publique n'est possible.
