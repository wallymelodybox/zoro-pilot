'use server'

import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'

/**
 * Issues a LiveKit room token scoped to a channel: only members of that
 * channel (per channel_members) may join its call room.
 */
export async function createCallToken(channelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.NEXT_PUBLIC_LIVEKIT_URL) {
    return { error: "LiveKit n'est pas configuré (variables d'environnement manquantes)." }
  }

  const { data: membership } = await supabase
    .from('channel_members')
    .select('channel_id')
    .eq('channel_id', channelId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return { error: "Vous n'êtes pas membre de ce canal." }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: user.id,
    name: profile?.name || user.email || user.id,
  })
  token.addGrant({
    room: `channel-${channelId}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  })

  return { success: true, token: await token.toJwt(), url: process.env.NEXT_PUBLIC_LIVEKIT_URL }
}
