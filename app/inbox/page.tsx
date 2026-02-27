"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Home,
  ChevronRight,
  MoreHorizontal,
  Bookmark,
  MessageSquare,
  AtSign,
  Archive,
  User,
  Mail,
  Search,
  Filter as FilterIcon,
  RefreshCw,
  Star,
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react"
import { connectGmail, fetchGmailMessages } from "@/app/actions"
import {
  type GmailMessage,
  getChannelMessages,
  channels,
  getUserById,
  getOrganizationById,
  getUserOrgTitle,
} from "@/lib/store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("tout")
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => new Set())

  const CURRENT_USER_ID = "u1"

  const filters = [
    { id: "tout", label: "Tout" },
    { id: "non-lu", label: "Non lu" },
    { id: "mentions", label: "@ Mentions", icon: AtSign },
    { id: "gmail", label: "Gmail", icon: Mail },
    { id: "commentaires", label: "Commentaires", icon: MessageSquare },
    { id: "archive", label: "Archive", icon: Archive },
  ]

  useEffect(() => {
    if (activeTab === "gmail" && isGmailConnected) {
      loadGmailMessages()
    }
  }, [activeTab, isGmailConnected])

  type InboxItem = {
    id: string
    source: "chat" | "gmail"
    category: "message" | "comment"
    title: string
    subtitle: string
    snippet: string
    date: string
    isUnread: boolean
    hasMention: boolean
    organizationName?: string
  }

  const buildChatItems = (): InboxItem[] => {
    return channels
      .map((ch) => {
        const msgs = getChannelMessages(ch.id)
        if (!msgs || msgs.length === 0) return null
        const last = msgs[msgs.length - 1]
        const sender = getUserById(last.senderId)
        const senderChatName =
          getUserOrgTitle(last.senderId, ch.organizationId) || sender?.role || sender?.name || "?"
        const isComment = ch.type === "context" || ch.contextType === "task"
        const orgName = ch.organizationId ? getOrganizationById(ch.organizationId)?.name : undefined

        const mentionNeedle = (() => {
          const me = getUserById(CURRENT_USER_ID)
          const nameNeedle = me?.name ? `@${me.name.split(" ")[0]}` : ""
          return nameNeedle
        })()

        const hasMention =
          last.content.includes("@") &&
          (last.content.includes("@all") || (mentionNeedle ? last.content.includes(mentionNeedle) : false))

        const id = `chat:${last.id}`
        const isUnread = !readIds.has(id)

        return {
          id,
          source: "chat",
          category: isComment ? "comment" : "message",
          title: ch.name,
          subtitle: senderChatName,
          snippet: last.content,
          date: last.timestamp,
          isUnread,
          hasMention,
          organizationName: orgName,
        } satisfies InboxItem
      })
      .filter(Boolean) as InboxItem[]
  }

  const buildGmailItems = (): InboxItem[] => {
    if (!isGmailConnected) return []
    return gmailMessages.map((m) => {
      const id = `gmail:${m.id}`
      const isUnread = !readIds.has(id) ? !m.isRead : false
      const hasMention = m.snippet.includes("@")
      return {
        id,
        source: "gmail",
        category: "message",
        title: m.subject,
        subtitle: m.from.split("<")[0].trim(),
        snippet: m.snippet,
        date: m.date,
        isUnread,
        hasMention,
      } satisfies InboxItem
    })
  }

  const allItems = [...buildChatItems(), ...buildGmailItems()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const visibleItems = (() => {
    const base = allItems.filter((it) => {
      const isArchived = archivedIds.has(it.id)
      if (activeTab === "archive") return isArchived
      return !isArchived
    })

    if (activeTab === "tout") return base
    if (activeTab === "non-lu") return base.filter((it) => it.isUnread)
    if (activeTab === "mentions") return base.filter((it) => it.hasMention)
    if (activeTab === "commentaires") return base.filter((it) => it.category === "comment")
    if (activeTab === "gmail") return base.filter((it) => it.source === "gmail")
    return base
  })()

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const toggleArchive = (id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const loadGmailMessages = async () => {
    setIsLoading(true)
    try {
      const res = await fetchGmailMessages()
      if (res.messages) {
        setGmailMessages(res.messages)
      }
    } catch (err) {
      toast.error("Impossible de charger les emails Gmail.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectGmail = async () => {
    setIsLoading(true)
    try {
      const res = await connectGmail()
      if (res.success) {
        setIsGmailConnected(true)
        toast.success(`Connecté à Gmail en tant que ${res.email}`)
      }
    } catch (err) {
      toast.error("Échec de la connexion à Gmail.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-transparent">
      {/* Header */}
      <header className="flex flex-col border-b bg-card/40 backdrop-blur-md sticky top-0 z-20">
        {/* Top Row: Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border/40">
           <Home className="h-3 w-3" />
           <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
           <span>Zoro Pilot</span>
           <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
           <span className="text-foreground">Boîte de réception</span>
        </div>

        {/* Second Row: Title & Filters */}
        <div className="flex items-center justify-between px-6 py-4">
           <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Inbox</h1>
              
              <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl border border-white/5">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 gap-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200",
                      activeTab === filter.id 
                        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    onClick={() => setActiveTab(filter.id)}
                  >
                    {filter.icon && <filter.icon className="h-3.5 w-3.5" />}
                    {filter.label}
                  </Button>
                ))}
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="relative w-64 hidden md:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <input 
                   placeholder="Filtrer l'inbox..." 
                   className="w-full bg-muted/30 border-white/5 h-9 pl-9 pr-4 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                 />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-white/5">
                <FilterIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-white/5">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} onClick={() => activeTab === 'gmail' && loadGmailMessages()} />
              </Button>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-muted/5 p-6">
        {activeTab === "gmail" ? (
          <div className="max-w-5xl mx-auto space-y-6">
            {!isGmailConnected ? (
              <Card className="border-dashed border-2 border-primary/20 bg-primary/5 p-12 text-center animate-in fade-in zoom-in duration-500">
                <CardContent className="flex flex-col items-center gap-6">
                  <div className="p-4 rounded-full bg-primary/10 text-primary mb-2 shadow-lg shadow-primary/5">
                    <Mail className="h-12 w-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Connectez votre Gmail</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Intégrez vos emails directement dans Zoro Pilot pour une gestion centralisée de vos communications.
                    </p>
                  </div>
                  <Button 
                    onClick={handleConnectGmail} 
                    className="gap-3 h-11 px-8 rounded-xl shadow-xl shadow-primary/20 font-bold tracking-wide"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                    Connecter avec Google
                  </Button>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Connexion sécurisée via OAuth 2.0
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                      {gmailMessages.filter(m => !m.isRead).length} NON LUS
                    </Badge>
                    <span className="text-sm text-muted-foreground font-medium">menannzoro@gmail.com</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-2 text-muted-foreground hover:text-foreground">
                    Ouvrir Gmail <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {gmailMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "group flex items-start gap-4 p-4 rounded-2xl border border-white/5 transition-all cursor-pointer hover:bg-card hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5",
                          msg.isRead ? "bg-card/40 opacity-70" : "bg-card shadow-sm border-l-4 border-l-primary"
                        )}
                      >
                        <div className="pt-1">
                           <div className={cn(
                             "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
                             msg.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/20"
                           )}>
                             {msg.from.charAt(0).toUpperCase()}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                           <div className="flex items-center justify-between gap-2">
                              <span className={cn("text-sm truncate", !msg.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                                {msg.from.split('<')[0].trim()}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {new Date(msg.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <h4 className={cn("text-sm truncate", !msg.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                             {msg.subject}
                           </h4>
                           <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                             {msg.snippet}
                           </p>
                           <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             {msg.labels.map(label => (
                               <Badge key={label} variant="secondary" className="text-[9px] font-bold tracking-widest px-1.5 py-0 bg-muted/50 text-muted-foreground border-none">
                                 {label}
                               </Badge>
                             ))}
                           </div>
                        </div>
                        <div className="flex flex-col gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10">
                             <Star className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                             <Archive className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {visibleItems.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-6 max-w-md text-center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
                    <div className="relative z-10 w-20 h-20 bg-linear-to-br from-primary to-primary-foreground/20 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 text-white">
                      <Bell className="h-10 w-10" fill="currentColor" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Inbox vide</h3>
                    <p className="text-muted-foreground font-medium text-sm px-10">
                      Il n'y a pas de notifications pour le moment dans l'onglet{" "}
                      <span className="text-foreground font-bold">{activeTab}</span>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleItems.map((it) => (
                  <div
                    key={it.id}
                    className={cn(
                      "group flex items-start gap-4 p-4 rounded-2xl border border-white/5 transition-all cursor-pointer hover:bg-card hover:shadow-lg hover:shadow-black/5",
                      it.isUnread ? "bg-card shadow-sm border-l-4 border-l-primary" : "bg-card/40 opacity-80"
                    )}
                    onClick={() => markRead(it.id)}
                  >
                    <div className="pt-1">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
                          it.source === "gmail"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {it.source === "gmail" ? "G" : "#"}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm truncate", it.isUnread ? "font-bold" : "font-medium text-muted-foreground")}
                        >
                          {it.subtitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(it.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className={cn("text-sm truncate", it.isUnread ? "font-bold text-foreground" : "font-medium text-muted-foreground")}
                      >
                        {it.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {it.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                      {it.hasMention && (
                        <Badge variant="secondary" className="text-[9px] font-bold tracking-widest px-1.5 py-0 bg-primary/10 text-primary border-none">
                          @
                        </Badge>
                      )}
                      {it.organizationName && (
                        <Badge variant="secondary" className="text-[9px] font-bold tracking-widest px-1.5 py-0 bg-muted/50 text-muted-foreground border-none">
                          {it.organizationName}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[9px] font-bold tracking-widest px-1.5 py-0 bg-muted/50 text-muted-foreground border-none">
                        {it.source.toUpperCase()}
                      </Badge>
                      {it.category === "comment" && (
                        <Badge variant="secondary" className="text-[9px] font-bold tracking-widest px-1.5 py-0 bg-muted/50 text-muted-foreground border-none">
                          COMMENTAIRE
                        </Badge>
                      )}
                    </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleArchive(it.id)
                        }}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
