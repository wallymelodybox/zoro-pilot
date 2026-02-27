"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  MessageSquare,
  Send,
  Hash,
  User as UserIcon,
  ChevronLeft,
  MoreVertical,
  Paperclip,
  Smile,
  Reply,
  MessageCircle,
  Plus,
  Search,
} from "lucide-react"
import {
  type Message,
  type MessageAttachment,
  type MessageEntityRef,
} from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSupabaseData } from "@/hooks/use-supabase"
import { createClient } from "@/lib/supabase/client"
import { bootstrapChat } from "@/app/actions"

// --- Fake current user for demo ---
// Current user comes from Supabase Auth

interface ChatPanelProps {
  contextId?: string // If provided, opens specific context channel
  trigger?: React.ReactNode
}

export function ChatPanel({ contextId, trigger }: ChatPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeChannelId, setActiveChannelId] = React.useState<string | null>(null)
  const [newMessage, setNewMessage] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeOrgId, setActiveOrgId] = React.useState<string>("all")
  const [draftAttachments, setDraftAttachments] = React.useState<MessageAttachment[]>([])
  const [draftEntityRef, setDraftEntityRef] = React.useState<MessageEntityRef | null>(null)
  const [isLinkOpen, setIsLinkOpen] = React.useState(false)

  const { projects, tasks } = useSupabaseData()

  const supabase = React.useMemo(() => createClient(), [])
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [channels, setChannels] = React.useState<{ id: string; name: string; type: any; organizationId?: string }[]>([])
  const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
  const [orgTitles, setOrgTitles] = React.useState<Record<string, string>>({})
  const [profiles, setProfiles] = React.useState<Record<string, { name: string; role: string; avatar?: string }>>({})
  const [localMessages, setLocalMessages] = React.useState<Message[]>([])
  const [reloadKey, setReloadKey] = React.useState(0)
  const [bootstrapError, setBootstrapError] = React.useState<string | null>(null)
  const [sendError, setSendError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isOpen) return

    const load = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setCurrentUserId(null)
        setChannels([])
        setOrganizations([])
        setOrgTitles({})
        setProfiles({})
        setActiveChannelId(null)
        setLocalMessages([])
        return
      }

      setCurrentUserId(user.id)

      const [{ data: orgs }, { data: memberships }, { data: profs }] = await Promise.all([
        supabase.from("organizations").select("id,name"),
        supabase.from("organization_members").select("organization_id,profile_id,title"),
        supabase.from("profiles").select("id,name,role,avatar_url"),
      ])

      setOrganizations((orgs ?? []) as any)

      const titleMap: Record<string, string> = {}
      for (const m of memberships ?? []) {
        const key = `${m.profile_id}:${m.organization_id}`
        titleMap[key] = m.title
      }
      setOrgTitles(titleMap)

      const profileMap: Record<string, { name: string; role: string; avatar?: string }> = {}
      for (const p of profs ?? []) {
        profileMap[p.id] = { name: p.name, role: p.role, avatar: p.avatar_url ?? undefined }
      }
      setProfiles(profileMap)

      const { data: cm } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", user.id)

      const channelIds = (cm ?? []).map((x) => x.channel_id)
      if (channelIds.length === 0) {
        setChannels([])
        setActiveChannelId(null)
        setLocalMessages([])
        return
      }

      const { data: chs } = await supabase
        .from("channels")
        .select("id,name,type,organization_id,context_id")
        .in("id", channelIds)

      const mapped = (chs ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        organizationId: c.organization_id ?? undefined,
        contextId: c.context_id ?? undefined,
      }))

      setChannels(mapped)

      if (contextId) {
        const match = mapped.find((c: any) => c.contextId === contextId)
        if (match) {
          setActiveChannelId(match.id)
          return
        }
      }

      setActiveChannelId((prev) => prev ?? (mapped.length > 0 ? mapped[0].id : null))
    }

    load()
  }, [contextId, isOpen, supabase, reloadKey])

  const availableOrgs = React.useMemo(() => {
    if (!currentUserId) return []
    const myOrgIds = new Set(
      Object.keys(orgTitles)
        .filter((k) => k.startsWith(`${currentUserId}:`))
        .map((k) => k.split(":")[1])
    )
    return organizations.filter((o) => myOrgIds.has(o.id))
  }, [currentUserId, orgTitles, organizations])

  const filteredChannels = React.useMemo(() => {
    const base =
      activeOrgId === "all"
        ? channels
        : channels.filter((c) => c.organizationId === activeOrgId)

    if (!searchQuery.trim()) return base
    const q = searchQuery.toLowerCase()
    return base.filter((c) => c.name.toLowerCase().includes(q))
  }, [activeOrgId, searchQuery, channels])
  
  const activeChannel = React.useMemo(
    () => channels.find((c) => c.id === activeChannelId) ?? null,
    [channels, activeChannelId]
  )

  React.useEffect(() => {
    if (!activeChannelId) {
      setLocalMessages([])
      return
    }

    void (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("channel_id", activeChannelId)
        .order("created_at", { ascending: true })
        .limit(200)
      if (error) return

      const mapped: Message[] = (data ?? []).map((m: any) => ({
        id: m.id,
        channelId: m.channel_id,
        senderId: m.sender_id,
        content: m.content,
        timestamp: m.created_at,
        type: m.type,
        attachments: m.attachments ?? undefined,
        entityRef: m.entity_type
          ? { type: m.entity_type, id: m.entity_id, title: m.entity_title }
          : undefined,
      }))

      setLocalMessages(mapped)
    })()
  }, [activeChannelId, supabase])

  React.useEffect(() => {
    if (!activeChannelId) return
    if (filteredChannels.some((c) => c.id === activeChannelId)) return
    setActiveChannelId(filteredChannels.length > 0 ? filteredChannels[0].id : null)
  }, [activeChannelId, filteredChannels])

  // Mock send message
  const handleSendMessage = () => {
    if (!activeChannelId || !currentUserId) return
    if (!newMessage.trim() && draftAttachments.length === 0 && !draftEntityRef) return

    void (async () => {
      setSendError(null)
      let uploadedAttachments: MessageAttachment[] | undefined

      if (draftAttachments.length > 0) {
        uploadedAttachments = []
        for (const a of draftAttachments) {
          const res = await fetch(a.url)
          const blob = await res.blob()
          const ext = a.name.includes(".") ? a.name.split(".").pop() : "bin"
          const path = `${activeChannelId}/${currentUserId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
          const upload = await supabase.storage.from("chat-media").upload(path, blob, {
            contentType: a.mimeType,
            upsert: false,
          })
          if (upload.error) throw upload.error
          const pub = supabase.storage.from("chat-media").getPublicUrl(path)
          uploadedAttachments.push({ ...a, url: pub.data.publicUrl })
        }
      }

      const payload: any = {
        channel_id: activeChannelId,
        sender_id: currentUserId,
        content: newMessage,
        type: draftEntityRef ? "entity" : uploadedAttachments && uploadedAttachments.length > 0 ? "file" : "text",
        attachments: uploadedAttachments ?? null,
        entity_type: draftEntityRef?.type ?? null,
        entity_id: draftEntityRef?.id ?? null,
        entity_title: draftEntityRef?.title ?? null,
      }

      const { data, error } = await supabase.from("messages").insert(payload).select("*").single()
      if (error) throw error

      const inserted: Message = {
        id: data.id,
        channelId: data.channel_id,
        senderId: data.sender_id,
        content: data.content,
        timestamp: data.created_at,
        type: data.type,
        attachments: data.attachments ?? undefined,
        entityRef: data.entity_type
          ? { type: data.entity_type, id: data.entity_id, title: data.entity_title }
          : undefined,
      }

      setLocalMessages((prev) => [...prev, inserted])
      setNewMessage("")
      setDraftAttachments([])
      setDraftEntityRef(null)
    })().catch((e) => {
      const msg = e instanceof Error ? e.message : "Erreur envoi message"
      setSendError(msg)
    })
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handlePickFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const next: MessageAttachment[] = []
    for (const f of Array.from(files)) {
      const mime = f.type
      const kind: MessageAttachment["kind"] = mime.startsWith("image/")
        ? "image"
        : mime.startsWith("video/")
        ? "video"
        : "file"

      next.push({
        kind,
        name: f.name,
        url: URL.createObjectURL(f),
        mimeType: mime,
      })
    }

    setDraftAttachments((prev) => [...prev, ...next])
  }

  const removeDraftAttachment = (idx: number) => {
    setDraftAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const linkProject = (id: string) => {
    const p = projects.find((x) => x.id === id)
    if (!p) return
    setDraftEntityRef({ type: "project", id: p.id, title: p.name })
    setIsLinkOpen(false)
  }

  const linkTask = (id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    setDraftEntityRef({ type: "task", id: t.id, title: t.title })
    setIsLinkOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Chat</span>
            {/* Notification dot mock */}
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-100 sm:w-135 flex flex-col p-0 gap-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            {activeChannel ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -ml-2 mr-1" 
                onClick={() => setActiveChannelId(null)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : null}
            <SheetTitle className="flex-1 text-left flex items-center gap-2">
              {activeChannel ? (
                <>
                  {activeChannel.type === "dm" ? <UserIcon className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                  {activeChannel.name}
                </>
              ) : (
                "Discussions"
              )}
            </SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {!activeChannel ? (
            // Channel List
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <Select value={activeOrgId} onValueChange={setActiveOrgId}>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue placeholder="Organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les organisations</SelectItem>
                      {availableOrgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                {filteredChannels.length === 0 ? (
                  <div className="p-2">
                    <div className="text-sm text-muted-foreground mb-3">Aucun channel.</div>
                    {bootstrapError ? (
                      <div className="text-sm text-destructive mb-3 wrap-break-word">{bootstrapError}</div>
                    ) : null}
                    <Button
                      type="button"
                      onClick={async () => {
                        setBootstrapError(null)
                        const res = await bootstrapChat()
                        if (res?.error) {
                          setBootstrapError(res.error)
                          return
                        }
                        setReloadKey((v) => v + 1)
                      }}
                    >
                      Initialiser le chat
                    </Button>
                  </div>
                ) : (
                  filteredChannels.map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className="w-full justify-start px-3 py-6 h-auto"
                      onClick={() => setActiveChannelId(channel.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {channel.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start gap-1 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium truncate">{channel.name}</span>
                            <span className="text-xs text-muted-foreground">12:30</span>
                          </div>
                          <span className="text-xs text-muted-foreground truncate w-full text-left">
                            Dernier message...
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            // Message List
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {localMessages.map((msg) => {
                    const isMe = currentUserId ? msg.senderId === currentUserId : false
                    const sender = profiles[msg.senderId]
                    const senderChatName =
                      (activeChannel?.organizationId
                        ? orgTitles[`${msg.senderId}:${activeChannel.organizationId}`]
                        : undefined) || sender?.role || sender?.name || "?"
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          isMe ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <Avatar className="h-8 w-8 mt-0.5">
                          <AvatarImage src={sender?.avatar} />
                          <AvatarFallback>{sender?.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "flex flex-col gap-1 group relative",
                          isMe ? "items-end" : "items-start"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {senderChatName}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          
                          {/* Message Content with context menu simulation */}
                          <div className="relative">
                            <div className={cn(
                              "p-3 rounded-2xl text-sm shadow-sm",
                              isMe 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : "bg-muted rounded-tl-none"
                            )}>
                              {msg.type === "entity" && msg.entityRef ? (
                                <div className="rounded-xl border border-border/40 bg-background/40 p-3 text-xs">
                                  <div className="font-semibold text-foreground">
                                    {msg.entityRef.type === "project" ? "Projet" : "Tâche"}
                                  </div>
                                  <div className="mt-1 font-medium">{msg.entityRef.title}</div>
                                </div>
                              ) : null}

                              {msg.content ? <div className={cn(msg.type === "entity" ? "mt-2" : "")}>{msg.content}</div> : null}

                              {msg.attachments && msg.attachments.length > 0 ? (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  {msg.attachments.map((a, idx) => (
                                    <div key={idx} className="rounded-lg overflow-hidden border border-border/40 bg-background/40">
                                      {a.kind === "image" ? (
                                        <img src={a.url} alt={a.name} className="h-28 w-full object-cover" />
                                      ) : a.kind === "video" ? (
                                        <video src={a.url} controls className="h-28 w-full object-cover" />
                                      ) : (
                                        <a href={a.url} target="_blank" rel="noreferrer" className="block p-2 text-xs underline">
                                          {a.name}
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            {/* Hover actions */}
                            <div className={cn(
                              "absolute -top-8 bg-card border rounded-lg shadow-xl p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10",
                              isMe ? "right-0" : "left-0"
                            )}>
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Smile className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6"><Reply className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6"><MessageCircle className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>

                          {/* Reactions Mock */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button key={emoji} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/50 border text-[10px] hover:bg-muted transition-colors">
                                  <span>{emoji}</span>
                                  <span className="font-semibold">{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {localMessages.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                      Aucun message. Commencez la discussion !
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                <div className="flex flex-col gap-2">
                  {draftEntityRef ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold">{draftEntityRef.type === "project" ? "Projet" : "Tâche"}:</span>{" "}
                        <span className="truncate">{draftEntityRef.title}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDraftEntityRef(null)}>
                        Retirer
                      </Button>
                    </div>
                  ) : null}

                  {draftAttachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {draftAttachments.map((a, idx) => (
                        <div key={idx} className="group relative rounded-lg border border-border/40 bg-muted/20 px-2 py-1 text-[10px]">
                          <span className="max-w-36 truncate inline-block align-middle">{a.name}</span>
                          <button
                            type="button"
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            onClick={() => removeDraftAttachment(idx)}
                            aria-label="Retirer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 bg-muted/50 rounded-2xl p-1.5 focus-within:bg-muted transition-colors border border-transparent focus-within:border-primary/20">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full"
                      onClick={handlePickFiles}
                      title="Joindre un fichier"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFilesSelected(e.target.files)}
                      aria-label="Joindre des fichiers"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full"
                      onClick={() => setIsLinkOpen(true)}
                      title="Lier un projet ou une tâche"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <div className="flex flex-1 min-w-0 items-center gap-2 px-3">
                      {sendError ? (
                        <div className="text-xs text-destructive truncate max-w-[45%]">{sendError}</div>
                      ) : null}
                      <Input
                        placeholder="Écrire un message..."
                        className="flex-1 border-0 focus-visible:ring-0 bg-transparent h-9 text-sm"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        aria-label="Votre message"
                      />

                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" title="Emojis">
                        <Smile className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && draftAttachments.length === 0 && !draftEntityRef}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 px-2">
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <span className="font-bold">Enter</span> pour envoyer
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <span className="font-bold">Shift + Enter</span> pour nouvelle ligne
                    </span>
                  </div>
                </div>
              </div>

              <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lier un élément</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Projets</div>
                      <div className="grid gap-2 max-h-40 overflow-auto">
                        {projects.map((p) => (
                          <Button key={p.id} type="button" variant="outline" className="justify-start" onClick={() => linkProject(p.id)}>
                            {p.name}
                          </Button>
                        ))}
                        {projects.length === 0 ? <div className="text-xs text-muted-foreground">Aucun projet</div> : null}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Tâches</div>
                      <div className="grid gap-2 max-h-40 overflow-auto">
                        {tasks.slice(0, 20).map((t) => (
                          <Button key={t.id} type="button" variant="outline" className="justify-start" onClick={() => linkTask(t.id)}>
                            {t.title}
                          </Button>
                        ))}
                        {tasks.length === 0 ? <div className="text-xs text-muted-foreground">Aucune tâche</div> : null}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsLinkOpen(false)}>
                      Fermer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
