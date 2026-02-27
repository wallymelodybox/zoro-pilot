'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * Creates a special Supabase client using the SERVICE ROLE KEY
 * to bypass RLS and use Admin Auth API.
 */
async function createAdminClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Secret key!
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a DG account, its organization and links them.
 */
export async function createDGAccount(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const licenseCode = formData.get('licenseCode') as string // Used as organization name for now or metadata

  if (!name || !email || !licenseCode) {
    return { error: "Tous les champs sont requis." }
  }

  try {
    const supabaseAdmin = await createAdminClient()

    // 1. Create the Organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([{ name: licenseCode }]) // We use the license code as the org name or part of it
      .select()
      .single()

    if (orgError) throw orgError

    // 2. Create the User in Supabase Auth (Admin API)
    // We generate a temporary password that the DG will change
    const tempPassword = Math.random().toString(36).slice(-10) + "!"
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: name }
    })

    if (authError) throw authError

    // 3. Create the Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authUser.user.id,
        email,
        name,
        role: 'Directeur Général',
        rbac_role: 'admin', // DG is an admin of their org
      }])

    if (profileError) throw profileError

    // 4. Link User to Organization
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert([{
        organization_id: org.id,
        profile_id: authUser.user.id,
        title: 'Directeur Général'
      }])

    if (memberError) throw memberError

    revalidatePath('/bo-zoro-control-2026-secure')
    
    return { 
      success: true, 
      tempPassword, 
      message: `Compte créé avec succès pour ${name}.` 
    }
  } catch (error: any) {
    console.error('DG Creation Error:', error)
    return { error: error.message || "Une erreur est survenue lors de la création." }
  }
}
