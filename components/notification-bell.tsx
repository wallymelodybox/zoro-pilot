"use client"

import * as React from "react"
import { Bell, Check, MessageSquare, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"

interface NotificationRow {
  id: string
  title: string
  content: string
  type: "info" | "alert" | "success" | "task" | "message"
  link: string | null
  is_read: boolean
  created_at: string
}

function NotificationIcon({ type }: { type: NotificationRow["type"] }) {
  switch (type) {
    case "task":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case "message":
      return <MessageSquare className="h-4 w-4 text-sky-500" />
    case "alert":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />
  }
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} j`
}

export function NotificationBell() {
  const { user } = useUser()
  const supabase = React.useMemo(() => createClient(), [])
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([])
  const [isOpen, setIsOpen] = React.useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const loadNotifications = React.useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)

    if (data) setNotifications(data as NotificationRow[])
  }, [supabase, user?.id])

  React.useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  React.useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationRow, ...prev].slice(0, 30))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user?.id])

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)
  }

  const markOneRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-90 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={markAllRead}>
              <Check className="h-3.5 w-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((n) => {
                const body = (
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 transition-colors hover:bg-muted/40 cursor-pointer",
                      !n.is_read && "bg-primary/5"
                    )}
                    onClick={() => markOneRead(n.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm truncate", !n.is_read ? "font-semibold" : "font-medium text-muted-foreground")}>
                          {n.title}
                        </span>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                      <span className="text-[10px] text-muted-foreground/70">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                )

                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setIsOpen(false)}>
                    {body}
                  </Link>
                ) : (
                  <div key={n.id}>{body}</div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
