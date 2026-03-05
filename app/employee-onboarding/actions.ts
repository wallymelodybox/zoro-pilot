'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function completeEmployeeOnboarding(formData: FormData) {
  const supabase = await createClient()
  
  const userName = formData.get('userName') as string
  const avatarUrl = formData.get('avatarUrl') as string
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  // Update Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      name: userName,
      avatar_url: avatarUrl,
      onboarding_completed: true 
    })
    .eq('id', user.id)

  if (profileError) throw profileError

  revalidatePath('/', 'layout')
  redirect('/')
}
