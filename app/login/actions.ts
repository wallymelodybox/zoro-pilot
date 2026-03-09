'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function ensureProfile() {
  const supabase = await createClient()

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
        avatar_url: null,
        team_id: null,
        rbac_role: 'super_admin',
        manager_id: null,
      })
    if (upsertError) return { error: upsertError.message }
    return { success: true }
  }

  // ── 2. UTILISATEUR EXISTANT — DG ou membre déjà provisionné
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, organization_id, rbac_role')
    .eq('id', user.id)
    .single()

  if (existingProfile && existingProfile.organization_id) {
    return { success: true }
  }

  // Profil admin/executive sans organization_id : tentative d'auto-réparation
  // depuis organization_members (créé à l'étape 4 de createDGAccount).
  // IMPORTANT : on ne laisse jamais passer un admin sans org_id pour éviter
  // que user_org_id() retourne null et expose toutes les données via RLS.
  if (existingProfile && (existingProfile.rbac_role === 'admin' || existingProfile.rbac_role === 'executive')) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single()

    if (member?.organization_id) {
      await supabase
        .from('profiles')
        .update({ organization_id: member.organization_id })
        .eq('id', user.id)
      return { success: true }
    }

    // Aucune org trouvée : compte DG corrompu, on bloque
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

  // Consommer l'invitation
  await supabase
    .from('invites')
    .update({ is_used: true, used_at: new Date().toISOString(), used_by: user.id })
    .eq('id', invite.id)

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

  const ensured = await ensureProfile()
  if ('error' in ensured && ensured.error) {
    redirect(`/login?error=${encodeURIComponent(ensured.error)}`)
  }

  revalidatePath('/', 'layout')

  const next = formData.get('next') as string
  if (next) {
    redirect(next)
  }

  redirect('/')
}

// ── signup et signInWithOAuth sont désactivés.
// La création de comptes se fait exclusivement via :
//   • Super Admin (BO) → crée les comptes DG
//   • DG → invite les membres de son organisation
// Aucune inscription publique n'est possible.
