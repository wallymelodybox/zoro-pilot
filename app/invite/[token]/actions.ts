'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Accepts an invitation using only the server-verified Supabase session.
 * The database function performs every write atomically and derives the
 * organization, role and email from trusted server-side records.
 */
export async function finalizeInviteAcceptance(token: string, name: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: "Session invalide. Connectez-vous avant d'accepter l'invitation." }
    }

    const { error } = await supabase.rpc('accept_invite', {
      invite_token: token,
      invitee_name: name,
    })

    if (error) return { error: error.message }
    return { success: true }
  } catch (error: unknown) {
    console.error('Finalize Invite Acceptance Error:', error)
    return { error: error instanceof Error ? error.message : "Erreur lors de la finalisation de l'invitation." }
  }
}
