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
  try {
    // ── Auth guard: seul le super admin peut créer des DG
    await assertSuperAdmin()

    const dgName = formData.get('name') as string
    const email = formData.get('email') as string
    const orgName = formData.get('orgName') as string
    const licenseType = (formData.get('licenseType') as string) || 'mensuelle'

    if (!dgName || !email || !orgName) {
      return { error: "Le nom du DG, l'email et le nom de l'organisation sont requis." }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("La clé SUPABASE_SERVICE_ROLE_KEY est manquante.")
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

    // On crée l'utilisateur sans métadonnées complexes pour éviter les triggers automatiques conflictuels
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


/**
 * Supprime une organisation et tous ses utilisateurs associés.
 * 🔒 Réservé au super admin. Vérifie le mot de passe du super admin avant suppression.
 */
export async function deleteOrganization(orgId: string, superAdminPassword: string) {
  try {
    const caller = await assertSuperAdmin()

    if (!orgId || !superAdminPassword) {
      return { error: "L'ID de l'organisation et le mot de passe sont requis." }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("La clé SUPABASE_SERVICE_ROLE_KEY est manquante.")
    }

    // Vérifier le mot de passe du super admin
    const supabaseAuth = await createClient()
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: caller.email!,
      password: superAdminPassword,
    })

    if (signInError) {
      return { error: "Mot de passe incorrect." }
    }

    const supabaseAdmin = await createAdminClient()

    // 1. Récupérer tous les profils liés à cette organisation
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('profile_id')
      .eq('organization_id', orgId)

    const profileIds = (members || []).map(m => m.profile_id)

    // 2. Supprimer les channel_members, channels de l'org
    const { data: channels } = await supabaseAdmin
      .from('channels')
      .select('id')
      .eq('organization_id', orgId)

    if (channels && channels.length > 0) {
      const channelIds = channels.map(c => c.id)
      await supabaseAdmin.from('channel_members').delete().in('channel_id', channelIds)
      await supabaseAdmin.from('messages').delete().in('channel_id', channelIds)
      await supabaseAdmin.from('channels').delete().in('id', channelIds)
    }

    // 3. Supprimer organization_members
    await supabaseAdmin.from('organization_members').delete().eq('organization_id', orgId)

    // 4. Supprimer les profils
    if (profileIds.length > 0) {
      await supabaseAdmin.from('profiles').delete().in('id', profileIds)
    }

    // 5. Supprimer les users Auth
    for (const profileId of profileIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(profileId)
      } catch (e) {
        console.warn(`Impossible de supprimer l'utilisateur Auth ${profileId} (peut-être déjà supprimé)`)
      }
    }

    // 6. Supprimer l'organisation
    const { error: orgDeleteError } = await supabaseAdmin
      .from('organizations')
      .delete()
      .eq('id', orgId)

    if (orgDeleteError) {
       // Si échec, on force la suppression des liens restants pour ne pas laisser de déchets
       await supabaseAdmin.from('organization_members').delete().eq('organization_id', orgId)
       throw orgDeleteError
    }

    revalidatePath('/bo-zoro-control-2026-secure')
    revalidatePath('/bo-zoro-control-2026-secure/licenses')

    return { success: true, message: "Organisation supprimée avec succès." }
  } catch (error: any) {
    console.error('Delete Organization Error:', error)
    return { error: error.message || "Erreur lors de la suppression." }
  }
}

/**
 * Récupère les détails complets des organisations avec le nombre d'utilisateurs.
 * 🔒 Réservé au super admin.
 */
export async function getOrganizationsWithDetails() {
  try {
    await assertSuperAdmin()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("La clé SUPABASE_SERVICE_ROLE_KEY est manquante.")
    }

    const supabaseAdmin = await createAdminClient()

    // Récupérer toutes les organisations
  const { data: orgs, error: orgsError } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (orgsError) return { error: orgsError.message }

  // Récupérer tous les profils avec leur org
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, role, rbac_role, organization_id, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) return { error: profilesError.message }

  // Compter les utilisateurs par organisation
  const orgDetails = (orgs || []).map(org => {
    const orgProfiles = (profiles || []).filter(p => p.organization_id === org.id)
    return {
      ...org,
      user_count: orgProfiles.length,
      users: orgProfiles,
    }
  })

  // Profils sans organisation (orphelins)
  const orphanProfiles = (profiles || []).filter(p => !p.organization_id)

    return {
      organizations: orgDetails,
      allProfiles: profiles || [],
      orphanProfiles,
      totalUsers: (profiles || []).length,
    }
  } catch (error: any) {
    console.error('Fetch Stats Error:', error)
    return { error: error.message || "Erreur lors de la récupération des statistiques." }
  }
}