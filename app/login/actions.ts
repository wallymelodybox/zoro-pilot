
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
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

