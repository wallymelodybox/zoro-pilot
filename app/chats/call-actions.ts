'use server'

import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'

async function canAccessChannelCall(supabase: Awaited<ReturnType<typeof createClient>>, channelId: string, userId: string) {
  const [{ data: channel }, { data: channelMembership }] = await Promise.all([
    supabase.from('channels').select('id,type,organization_id').eq('id', channelId).maybeSingle(),
    supabase.from('channel_members').select('channel_id').eq('channel_id', channelId).eq('user_id', userId).maybeSingle(),
  ])

  if (!channel) return false
  if (channelMembership) return true
  if (channel.type !== 'public' || !channel.organization_id) return false

  const { data: organizationMembership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', channel.organization_id)
    .eq('profile_id', userId)
    .maybeSingle()

  return Boolean(organizationMembership)
}

export async function startCall(channelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  if (!await canAccessChannelCall(supabase, channelId, user.id)) {
    return { error: "Vous n'êtes pas membre de ce canal." }
  }

  await supabase
    .from('call_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('channel_id', channelId)
    .eq('caller_id', user.id)
    .eq('status', 'ringing')

  const { data, error } = await supabase
    .from('call_sessions')
    .insert({ channel_id: channelId, caller_id: user.id })
    .select('id')
    .single()

  if (error) return { error: "Impossible de lancer l'appel." }
  return { success: true, callId: data.id }
}

export async function endCall(callId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { error } = await supabase
    .from('call_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', callId)
    .eq('caller_id', user.id)

  if (error) return { error: "Impossible de terminer l'appel." }
  return { success: true }
}

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

  if (!await canAccessChannelCall(supabase, channelId, user.id)) {
    return { error: "Vous n'êtes pas membre de ce canal." }
  }

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
