
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function ensureProfile(fullName?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Utilisateur non authentifié.' }
  }

  const email = user.email || `user-${user.id}@example.com`
  const name = fullName || (email.includes('@') ? email.split('@')[0] : email)

  // Determine RBAC role: 
  // - Owner's email gets super_admin
  // - Others get member by default (unless updated by a DG)
  const rbac_role = email === 'menannzoro@gmail.com' ? 'super_admin' : 'member'
  const role = rbac_role === 'super_admin' ? 'Propriétaire' : 'Membre'

  // If not super_admin, verify if there is a valid invitation for this email
  if (rbac_role !== 'super_admin') {
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('invited_email', email)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invite) {
      return { error: "Accès refusé. Une invitation valide est requise pour se connecter." }
    }

    // Mark invite as used and get organization_id
    await supabase
      .from('invites')
      .update({ is_used: true, used_at: new Date().toISOString(), used_by: user.id })
      .eq('id', invite.id)

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email,
        name,
        role: invite.role_assigned || 'Membre',
        avatar_url: null,
        team_id: null,
        rbac_role: invite.rbac_role_assigned || 'member',
        organization_id: invite.organization_id,
        manager_id: invite.created_by,
      })

    if (upsertError) return { error: upsertError.message }
  } else {
    // Super Admin logic (existing)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email,
        name,
        role,
        avatar_url: null,
        team_id: null,
        rbac_role,
        manager_id: null,
      })
    
    if (upsertError) return { error: upsertError.message }
  }

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
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.session) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Compte créé. Confirmez l'email reçu pour activer la connexion."
      )}`
    )
  }

  const ensured = await ensureProfile(fullName)
  if ('error' in ensured && ensured.error) {
    redirect(`/login?error=${encodeURIComponent(ensured.error)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithOAuth(provider: 'google' | 'apple' | 'azure') {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}

export async function loginDemo() {
  const supabase = await createClient()

  // Tentative de connexion avec le compte propriétaire par défaut pour la démo
  // Si le compte n'existe pas ou le mot de passe est différent, cela redirigera normalement
  // Note: C'est une aide au développement pour accéder rapidement au BO.
  const { error } = await supabase.auth.signInWithPassword({
    email: 'menannzoro@gmail.com',
    password: 'password123', // Remplacez par votre mot de passe de test si nécessaire
  })

  if (error) {
    // Si la connexion auto échoue (ex: mauvais mot de passe), on redirige simplement vers l'accueil
    // ou on affiche une erreur spécifique
    redirect(`/login?error=${encodeURIComponent("Mode démo : Échec de la connexion automatique. Connectez-vous manuellement.")}`)
  }

  const ensured = await ensureProfile()
  if ('error' in ensured && ensured.error) {
    redirect(`/login?error=${encodeURIComponent(ensured.error)}`)
  }

  revalidatePath('/', 'layout')
  // Pour le mode démo propriétaire, on redirige DIRECTEMENT vers le BO secret
  redirect('/bo-zoro-control-2026-secure')
}

