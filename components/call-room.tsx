"use client"

import * as React from "react"
import { LiveKitRoom, VideoConference, useConnectionState, useParticipants } from "@livekit/components-react"
import { ConnectionState } from "livekit-client"
import { Clock3, Maximize2, Mic, Minimize2, PhoneOff, Radio, Users } from "lucide-react"
import "@livekit/components-styles"
import { createCallToken } from "@/app/chats/call-actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function CallDetails({ channelName, minimized }: { channelName: string; minimized: boolean }) {
  const participants = useParticipants()
  const connectionState = useConnectionState()
  const [duration, setDuration] = React.useState(0)

  React.useEffect(() => {
    const timer = window.setInterval(() => setDuration((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const connected = connectionState === ConnectionState.Connected

  if (minimized) {
    return (
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{channelName}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-white/65">
          <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{formatDuration(duration)}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{participants.length}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-base font-semibold text-white">{channelName}</h2>
          <span className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            connected ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"
          )}>
            <Radio className="h-3 w-3" /> {connected ? "En direct" : "Connexion"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-4 text-xs text-white/55">
          <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{formatDuration(duration)}</span>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{participants.length} participant{participants.length > 1 ? "s" : ""}</span>
          <span className="hidden items-center gap-1.5 sm:flex"><Mic className="h-3.5 w-3.5" />Audio et vidéo sécurisés</span>
        </div>
      </div>
      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        {participants.slice(0, 4).map((participant) => (
          <span key={participant.identity} className="max-w-32 truncate rounded-full bg-white/8 px-3 py-1 text-xs text-white/70">
            {participant.name || participant.identity}
          </span>
        ))}
        {participants.length > 4 && <span className="text-xs text-white/50">+{participants.length - 4}</span>}
      </div>
    </div>
  )
}

export function CallRoom({
  channelId,
  channelName,
  open,
  onOpenChange,
}: {
  channelId: string
  channelName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [token, setToken] = React.useState<string | null>(null)
  const [url, setUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [minimized, setMinimized] = React.useState(false)
  const onOpenChangeRef = React.useRef(onOpenChange)

  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  const closeCall = React.useCallback(() => {
    onOpenChangeRef.current(false)
  }, [])

  React.useEffect(() => {
    if (!open) {
      setToken(null)
      setUrl(null)
      setLoading(false)
      setMinimized(false)
      return
    }

    let cancelled = false
    setLoading(true)
    createCallToken(channelId).then((res) => {
      if (cancelled) return
      setLoading(false)
      if ("error" in res && res.error) {
        toast.error(res.error)
        closeCall()
        return
      }
      if ("token" in res && res.token && res.url) {
        setToken(res.token)
        setUrl(res.url)
      }
    })

    return () => { cancelled = true }
  }, [open, channelId, closeCall])

  if (!open) return null

  return (
    <div className={cn(
      "fixed z-[100] transition-all duration-300",
      minimized
        ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 w-[min(22rem,calc(100vw-1.5rem))] md:bottom-5 md:right-5"
        : "inset-0 flex items-center justify-center bg-black/75 p-0 backdrop-blur-md md:p-5"
    )}>
      <div className={cn(
        "relative flex overflow-hidden border border-white/10 bg-[#0b0d12] text-white shadow-2xl transition-all duration-300",
        minimized
          ? "h-24 w-full flex-row items-center rounded-2xl px-4"
          : "h-full w-full flex-col md:h-[min(88vh,850px)] md:max-w-6xl md:rounded-3xl"
      )}>
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b0d12] text-sm text-white/60">
            Connexion à l’appel…
          </div>
        )}

        {token && url && (
          <LiveKitRoom
            token={token}
            serverUrl={url}
            connect
            audio
            video
            data-lk-theme="default"
            className="flex h-full min-h-0 w-full flex-col"
            onDisconnected={closeCall}
          >
            <header className={cn(
              "z-10 flex shrink-0 items-center border-b border-white/10 bg-[#11141b]",
              minimized ? "w-full border-0 bg-transparent" : "min-h-20 gap-4 px-5 py-3"
            )}>
              <CallDetails channelName={channelName} minimized={minimized} />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-white/75 hover:bg-white/10 hover:text-white"
                  title={minimized ? "Agrandir l’appel" : "Réduire l’appel"}
                  onClick={() => setMinimized((current) => !current)}
                >
                  {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-red-500 text-white hover:bg-red-600"
                  title="Quitter l’appel"
                  onClick={closeCall}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className={cn("min-h-0 flex-1", minimized && "hidden")}>
              <VideoConference />
            </div>
          </LiveKitRoom>
        )}
      </div>
    </div>
  )
}
