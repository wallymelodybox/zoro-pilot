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
  //    Un profil existe s'il a été créé par le BO (DG) ou via une invitation (membre).
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, organization_id, rbac_role')
    .eq('id', user.id)
    .single()

  if (existingProfile && existingProfile.organization_id) {
    // Profil valide, rattaché à une organisation → OK
    return { success: true }
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
    // Pas de profil existant, pas d'invitation valide → accès refusé
    // On déconnecte aussi le user Supabase Auth pour éviter les cookies orphelins
    await supabase.auth.signOut()
    return { error: "Accès refusé. Votre compte doit être créé par un administrateur ou via une invitation valide." }
  }

  // Consommer l'invitation
  await supabase
    .from('invites')
    .update({ is_used: true, used_at: new Date().toISOString(), used_by: user.id })
    .eq('id', invite.id)

  // Créer/mettre à jour le profil avec les données de l'invitation
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

  // Redirection post-login :
  // - Le super admin doit se connecter sur le domaine admin (zoro-secure-control-net.company)
  //   où le proxy réécrit `/` vers le BO automatiquement.
  // - S'il se connecte sur le domaine app, il arrive sur le dashboard client (normal).
  // - Pas de redirect cross-domain car les cookies de session ne traversent pas les domaines.
  redirect('/')
}

// ── signup et signInWithOAuth sont désactivés.
// La création de comptes se fait exclusivement via :
//   • Super Admin (BO) → crée les comptes DG
//   • DG → invite les membres de son organisation
// Aucune inscription publique n'est possible.
