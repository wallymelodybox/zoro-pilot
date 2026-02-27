'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  
  const orgName = formData.get('orgName') as string
  const logoUrl = formData.get('logoUrl') as string
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) throw new Error("Organisation non trouvée")

  // 1. Update Organization
  const { error: orgError } = await supabase
    .from('organizations')
    .update({ 
      name: orgName, 
      logo_url: logoUrl,
      setup_completed: true 
    })
    .eq('id', profile.organization_id)

  if (orgError) throw orgError

  // 2. Update Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (profileError) throw profileError

  revalidatePath('/', 'layout')
  redirect('/')
}
