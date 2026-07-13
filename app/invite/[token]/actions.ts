'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Finalizes invite acceptance after the invitee has an authenticated user (userId, email, name):
 * links the profile to the invite's organization, creates the organization_members row,
 * and marks the invite as used. Runs with the service-role key because the invitee's own
 * session has no RLS grant to insert into organization_members.
 */
export async function finalizeInviteAcceptance(token: string, userId: string, email: string, name: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("La clé SUPABASE_SERVICE_ROLE_KEY est manquante.")
    }

    const supabaseAdmin = createAdminClient()

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('invites')
      .select('*')
      .or(`token.eq.${token},invite_code.eq.${token}`)
      .maybeSingle()

    if (inviteError || !invite) {
      return { error: "Invitation introuvable." }
    }

    if (invite.is_used) {
      return { error: "Cette invitation a déjà été utilisée." }
    }

    if (new Date(invite.expires_at) < new Date()) {
      return { error: "Cette invitation a expiré." }
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        name,
        role: invite.role_assigned,
        rbac_role: invite.rbac_role_assigned,
        organization_id: invite.organization_id,
      }, { onConflict: 'id' })

    if (profileError) {
      return { error: profileError.message }
    }

    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .upsert({
        organization_id: invite.organization_id,
        profile_id: userId,
        title: invite.role_assigned,
      }, { onConflict: 'organization_id,profile_id' })

    if (memberError) {
      return { error: memberError.message }
    }

    await supabaseAdmin
      .from('invites')
      .update({ is_used: true, used_at: new Date().toISOString(), used_by: userId })
      .eq('id', invite.id)

    return { success: true }
  } catch (error: any) {
    console.error('Finalize Invite Acceptance Error:', error)
    return { error: error.message || "Erreur lors de la finalisation de l'invitation." }
  }
}
