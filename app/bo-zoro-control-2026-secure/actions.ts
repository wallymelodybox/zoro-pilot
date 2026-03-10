'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
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

    const supabaseAdmin = createAdminClient()

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
    // On utilise upsert pour écraser un éventuel profil vide créé par un trigger DB
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        email,
        name: dgName,
        role: 'Directeur Général',
        rbac_role: 'admin',
        organization_id: org.id,
      }, { onConflict: 'id' })

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
 * Réinitialise le mot de passe d'un DG et retourne le nouveau code d'accès.
 * 🔒 Réservé au super admin.
 */
export async function resetDGPassword(profileId: string) {
  try {
    await assertSuperAdmin()

    if (!profileId) {
      return { error: "L'ID du profil est requis." }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("La clé SUPABASE_SERVICE_ROLE_KEY est manquante.")
    }

    const supabaseAdmin = createAdminClient()

    // Vérifier que le profil existe et est bien un DG
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, rbac_role')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return { error: "Profil introuvable." }
    }

    if (profile.rbac_role !== 'admin' && profile.rbac_role !== 'executive') {
      return { error: "Ce profil n'est pas un Directeur Général." }
    }

    // Générer un nouveau mot de passe
    const newPassword = randomBytes(15).toString('base64url') + '!A1'

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profileId,
      { password: newPassword }
    )

    if (updateError) throw updateError

    return {
      success: true,
      newPassword,
      message: `Mot de passe réinitialisé pour ${profile.name} (${profile.email}).`
    }
  } catch (error: any) {
    console.error('Reset DG Password Error:', error)
    return { error: error.message || "Erreur lors de la réinitialisation." }
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

    const supabaseAdmin = createAdminClient()

    // 1. Récupérer tous les profils liés à cette organisation
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('profile_id')
      .eq('organization_id', orgId)

    // Ne jamais supprimer le super admin lui-même
    const profileIds = (members || [])
      .map(m => m.profile_id)
      .filter(id => id !== caller.id)

    // 2. Supprimer les invitations liées à l'org
    await supabaseAdmin.from('invites').delete().eq('organization_id', orgId)

    // 3. Supprimer tasks, key_results, objectives, pillars, projects (FK sur profiles)
    await supabaseAdmin.from('tasks').delete().eq('organization_id', orgId)

    const { data: orgObjectives } = await supabaseAdmin
      .from('objectives')
      .select('id')
      .eq('organization_id', orgId)

    if (orgObjectives && orgObjectives.length > 0) {
      const objectiveIds = orgObjectives.map(o => o.id)
      await supabaseAdmin.from('okr_checkins').delete().in('key_result_id',
        (await supabaseAdmin.from('key_results').select('id').in('objective_id', objectiveIds)).data?.map(k => k.id) || []
      )
      await supabaseAdmin.from('key_results').delete().in('objective_id', objectiveIds)
      await supabaseAdmin.from('project_objectives').delete().in('objective_id', objectiveIds)
    }

    await supabaseAdmin.from('objectives').delete().eq('organization_id', orgId)
    await supabaseAdmin.from('pillars').delete().eq('organization_id', orgId)

    const { data: orgProjects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('organization_id', orgId)

    if (orgProjects && orgProjects.length > 0) {
      const projectIds = orgProjects.map(p => p.id)
      await supabaseAdmin.from('project_objectives').delete().in('project_id', projectIds)
      await supabaseAdmin.from('project_key_results').delete().in('project_id', projectIds)
    }

    await supabaseAdmin.from('projects').delete().eq('organization_id', orgId)

    // 3. Supprimer les channel_members, channels de l'org
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

    // 4. Nullifier les FK vers profiles avant suppression des teams et profils
    if (profileIds.length > 0) {
      await supabaseAdmin.from('teams').update({ manager_id: null }).in('manager_id', profileIds)
      await supabaseAdmin.from('profiles').update({ manager_id: null }).in('manager_id', profileIds)
    }

    // 5. Supprimer les teams de l'org
    await supabaseAdmin.from('teams').delete().eq('organization_id', orgId)

    // 6. Supprimer organization_members
    await supabaseAdmin.from('organization_members').delete().eq('organization_id', orgId)

    // 7. Supprimer les profils
    if (profileIds.length > 0) {
      await supabaseAdmin.from('profiles').delete().in('id', profileIds)
    }

    // 7. Supprimer les users Auth
    for (const profileId of profileIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(profileId)
      } catch (e) {
        console.warn(`Impossible de supprimer l'utilisateur Auth ${profileId} (peut-être déjà supprimé)`)
      }
    }

    // 8. Supprimer l'organisation
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
 * Récupère les stats du dashboard (organisations + total profils).
 * 🔒 Réservé au super admin.
 */
export async function getDashboardStats() {
  try {
    await assertSuperAdmin()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("La clé SUPABASE_SERVICE_ROLE_KEY est manquante.")
    }

    const supabaseAdmin = createAdminClient()

    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgsError) return { error: orgsError.message }

    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return {
      organizations: orgs || [],
      totalProfiles: count || 0,
    }
  } catch (error: any) {
    console.error('Fetch Dashboard Stats Error:', error)
    return { error: error.message || "Erreur lors de la récupération des statistiques." }
  }
}

/**
 * Récupère les paramètres globaux du système.
 * 🔒 Réservé au super admin.
 */
export async function getSystemSettings() {
  try {
    await assertSuperAdmin()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'global')
      .single()

    if (error) throw error
    return { settings: data }
  } catch (error: any) {
    console.error('Erreur getSystemSettings:', error)
    return { error: error.message || "Erreur lors de la récupération des paramètres." }
  }
}

/**
 * Met à jour les paramètres globaux du système.
 * 🔒 Réservé au super admin.
 */
export async function updateSystemSettings(settings: any) {
  try {
    const user = await assertSuperAdmin()
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 'global',
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })

    if (error) throw error
    
    revalidatePath('/bo-zoro-control-2026-secure/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Erreur updateSystemSettings:', error)
    return { error: error.message || "Erreur lors de la mise à jour des paramètres." }
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

    const supabaseAdmin = createAdminClient()

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