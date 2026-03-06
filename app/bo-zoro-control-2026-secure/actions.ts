'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

/**
 * Vérifie que l'appelant est bien le super admin.
 * Doit être appelé au début de chaque action sensible du BO.
 */
async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Non authentifié.')
  if (user.email !== 'menannzoro@gmail.com') {
    throw new Error('Accès refusé. Réservé au super admin.')
  }
  return user
}

/**
 * Creates a special Supabase client using the SERVICE ROLE KEY
 * to bypass RLS and use Admin Auth API.
 */
async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
            // Ignored in Server Components
          }
        },
      },
    }
  )
}

/**
 * Creates a DG account, its organization and links them.
 * 🔒 Réservé au super admin.
 */
export async function createDGAccount(formData: FormData) {
  // ── Auth guard: seul le super admin peut créer des DG
  await assertSuperAdmin()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const licenseCode = formData.get('licenseCode') as string

  if (!name || !email || !licenseCode) {
    return { error: "Tous les champs sont requis." }
  }

  try {
    const supabaseAdmin = await createAdminClient()

    // 1. Create the Organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([{ name: licenseCode }])
      .select()
      .single()

    if (orgError) throw orgError

    // 2. Create the User in Supabase Auth (Admin API)
    // Mot de passe temporaire cryptographiquement sûr (20 chars, ~120 bits d'entropie)
    const tempPassword = randomBytes(15).toString('base64url') + '!A1'

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: name }
    })

    if (authError) throw authError

    // 3. Create the Profile linked to the organization
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authUser.user.id,
        email,
        name,
        role: 'Directeur Général',
        rbac_role: 'admin',
        organization_id: org.id,
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
