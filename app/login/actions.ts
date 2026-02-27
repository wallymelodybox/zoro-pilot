
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

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email,
      name,
      role: 'Membre',
      avatar_url: null,
      team_id: null,
      rbac_role: 'member',
      manager_id: null,
    })

  if (error) {
    return { error: error.message }
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
  // Simule une connexion réussie pour l'environnement de développement
  // En production, cela ne devrait pas exister ou être protégé
  
  // On peut définir un cookie "demo-session" par exemple, 
  // mais pour l'instant on va juste rediriger vers la home 
  // en supposant que le middleware laisse passer ou qu'on le désactive temporairement
  
  // Note: Pour une vraie simulation, il faudrait mocker supabase.auth.getUser() 
  // dans le middleware, ou utiliser un compte de test réel dans Supabase.
  
  // Pour l'instant, simple redirection pour tester l'UI
  revalidatePath('/', 'layout')
  redirect('/')
}

