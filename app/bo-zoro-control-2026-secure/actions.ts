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

  const dgName = formData.get('name') as string
  const email = formData.get('email') as string
  const orgName = formData.get('orgName') as string
  const licenseType = (formData.get('licenseType') as string) || 'mensuelle'

  if (!dgName || !email || !orgName) {
    return { error: "Le nom du DG, l'email et le nom de l'organisation sont requis." }
  }

  const supabaseAdmin = await createAdminClient()

  // ── Calculer la date d'expiration selon le type de licence
  let expiresAt: string | null = null
  if (licenseType !== 'definitive') {
    const now = new Date()
    const durations: Record<string, number> = {
      mensuelle: 30,
      trimestrielle: 90,
      semestrielle: 180,
      annuelle: 365,
    }
    const days = durations[licenseType] || 30
    now.setDate(now.getDate() + days)
    expiresAt = now.toISOString()
  }

  try {
    // 1. Créer l'Organisation avec la licence
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([{
        name: orgName,
        license_type: licenseType,
        expires_at: expiresAt,
      }])
      .select()
      .single()

    if (orgError) throw orgError

    // 2. Créer le User Auth (mot de passe temporaire sûr)
    const tempPassword = randomBytes(15).toString('base64url') + '!A1'

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: dgName }
    })

    if (authError) {
      // Rollback: supprimer l'org créée
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      throw authError
    }

    // 3. Créer le Profil lié à l'organisation
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authUser.user.id,
        email,
        name: dgName,
        role: 'Directeur Général',
        rbac_role: 'admin',
        organization_id: org.id,
      }])

    if (profileError) {
      // Rollback: supprimer user Auth + org
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      throw profileError
    }

    // 4. Lier le User à l'Organisation
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert([{
        organization_id: org.id,
        profile_id: authUser.user.id,
        title: 'Directeur Général'
      }])

    if (memberError) {
      // Rollback complet
      await supabaseAdmin.from('profiles').delete().eq('id', authUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      throw memberError
    }

    revalidatePath('/bo-zoro-control-2026-secure')
    revalidatePath('/bo-zoro-control-2026-secure/licenses')

    return {
      success: true,
      tempPassword,
      orgId: org.id,
      message: `Compte DG créé pour ${dgName} (${orgName}).`
    }
  } catch (error: any) {
    console.error('DG Creation Error:', error)
    return { error: error.message || "Une erreur est survenue lors de la création." }
  }
}
