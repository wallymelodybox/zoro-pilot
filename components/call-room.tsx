"use client"

import * as React from "react"
import { LiveKitRoom, VideoConference } from "@livekit/components-react"
import "@livekit/components-styles"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createCallToken } from "@/app/chats/call-actions"
import { toast } from "sonner"

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

  React.useEffect(() => {
    if (!open) {
      setToken(null)
      setUrl(null)
      return
    }

    let cancelled = false
    setLoading(true)
    createCallToken(channelId).then((res) => {
      if (cancelled) return
      setLoading(false)
      if ("error" in res && res.error) {
        toast.error(res.error)
        onOpenChange(false)
        return
      }
      if ("token" in res && res.token && res.url) {
        setToken(res.token)
        setUrl(res.url)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, channelId, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-3 border-b border-border/40">
          <DialogTitle>Appel — {channelName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {loading && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Connexion à l'appel...
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
              style={{ height: "100%" }}
              onDisconnected={() => onOpenChange(false)}
            >
              <VideoConference />
            </LiveKitRoom>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
