"use client"

import * as React from "react"
import { Phone, PhoneOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CallRoom } from "@/components/call-room"

type IncomingCall = {
  id: string
  channel_id: string
  caller_id: string
  channels?: { name?: string } | null
  profiles?: { name?: string } | null
}

export function IncomingCallListener() {
  const supabase = React.useMemo(() => createClient(), [])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [incomingCall, setIncomingCall] = React.useState<IncomingCall | null>(null)
  const [joinedCall, setJoinedCall] = React.useState<IncomingCall | null>(null)

  const loadCall = React.useCallback(async (callId: string) => {
    const { data } = await supabase
      .from("call_sessions")
      .select("id,channel_id,caller_id,channels(name),profiles!call_sessions_caller_id_fkey(name)")
      .eq("id", callId)
      .eq("status", "ringing")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (data && data.caller_id !== userId) setIncomingCall(data as unknown as IncomingCall)
  }, [supabase, userId])

  React.useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  React.useEffect(() => {
    if (!userId) return

    void (async () => {
      const { data } = await supabase
        .from("call_sessions")
        .select("id")
        .eq("status", "ringing")
        .neq("caller_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) await loadCall(data.id)
    })()

    const channel = supabase
      .channel(`incoming-calls:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "call_sessions" }, (payload) => {
        if (payload.new.caller_id !== userId) void loadCall(payload.new.id)
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "call_sessions" }, (payload) => {
        if (payload.new.status === "ended") {
          setIncomingCall((current) => current?.id === payload.new.id ? null : current)
        }
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [loadCall, supabase, userId])

  const channelName = incomingCall?.channels?.name || "Discussion"
  const callerName = incomingCall?.profiles?.name || "Un membre"
  const handleJoinedCallOpenChange = React.useCallback((open: boolean) => {
    if (!open) setJoinedCall(null)
  }, [])

  return (
    <>
      <Dialog open={Boolean(incomingCall)} onOpenChange={(open) => !open && setIncomingCall(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Appel entrant</DialogTitle>
            <DialogDescription>{callerName} vous appelle dans « {channelName} ».</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIncomingCall(null)}>
              <PhoneOff className="mr-2 h-4 w-4" /> Refuser
            </Button>
            <Button onClick={() => { setJoinedCall(incomingCall); setIncomingCall(null) }}>
              <Phone className="mr-2 h-4 w-4" /> Rejoindre
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {joinedCall && (
        <CallRoom
          channelId={joinedCall.channel_id}
          channelName={joinedCall.channels?.name || "Discussion"}
          open
          onOpenChange={handleJoinedCallOpenChange}
        />
      )}
    </>
  )
}
