"use client"

import * as React from "react"
import {
  Search,
  Hash,
  User as UserIcon,
  MoreVertical,
  Plus,
  Send,
  Paperclip,
  Smile,
  Reply,
  MessageCircle,
  MessageSquare,
} from "lucide-react"
import {
  getUserById,
  getUserChannels,
  getChannelMessages,
  getChannelById,
} from "@/lib/store"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

const CURRENT_USER_ID = "u1"

export default function ChatsPage() {
  const [activeChannelId, setActiveChannelId] = React.useState<string | null>("c1")
  const [newMessage, setNewMessage] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")

  const userChannels = getUserChannels(CURRENT_USER_ID)
  const activeChannel = activeChannelId ? getChannelById(activeChannelId) : null
  const messages = activeChannelId ? getChannelMessages(activeChannelId) : []

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChannelId) return
    console.log(`Sending message to ${activeChannelId}: ${newMessage}`)
    setNewMessage("")
  }

  return (
    <div className="flex h-full bg-transparent overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-80 flex flex-col border-r border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="p-6 border-b border-border/40">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 bg-background/40 border-border/40 h-9 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {userChannels.map((channel) => {
              const isActive = activeChannelId === channel.id
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setActiveChannelId(channel.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-4 rounded-xl transition-all text-left",
                    isActive 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/40 border border-transparent"
                  )}
                >
                  <UserAvatar name={channel.name} fallback={channel.name.substring(0, 2).toUpperCase()} className="h-10 w-10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-sm font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>
                        {channel.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">12:30</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {messages.length > 0 ? messages[messages.length - 1].content : "Aucun message"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-transparent">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <UserAvatar name={activeChannel.name} fallback={activeChannel.name.substring(0, 2).toUpperCase()} className="h-9 w-9" />
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    {activeChannel.type === "dm" ? <UserIcon className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5 text-primary" />}
                    {activeChannel.name}
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    {activeChannel.memberIds.length} membres
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Search className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6 pb-4">
                {messages.map((msg) => {
                  const isMe = msg.senderId === CURRENT_USER_ID
                  const sender = getUserById(msg.senderId)
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3 max-w-[80%] group relative",
                        isMe ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <UserAvatar name={sender?.name || "?"} fallback={sender?.avatar || "?"} className="h-8 w-8 mt-1 shrink-0" />
                      <div className={cn(
                        "flex flex-col gap-1",
                        isMe ? "items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground/80">
                            {sender?.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        
                        <div className="relative">
                          <div className={cn(
                            "p-3 rounded-2xl text-sm shadow-sm border border-border/40",
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-tr-none border-primary/20" 
                              : "bg-card/60 backdrop-blur-sm rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>

                          {/* Actions on hover */}
                          <div className={cn(
                            "absolute -top-8 bg-card border border-border/40 rounded-lg shadow-xl p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10",
                            isMe ? "right-0" : "left-0"
                          )}>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><Smile className="h-3.5 w-3.5" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><Reply className="h-3.5 w-3.5" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6"><MessageCircle className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>

                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <button key={emoji} type="button" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/40 border border-border/40 text-[10px] hover:bg-muted transition-colors">
                                <span>{emoji}</span>
                                <span className="font-bold">{users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Input */}
            <footer className="p-6 border-t border-border/40 bg-card/20 backdrop-blur-md">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-2xl p-2 border border-border/40 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                      <Paperclip className="h-4.5 w-4.5" />
                    </Button>
                    <Input 
                      placeholder="Écrire un message..." 
                      className="border-0 focus-visible:ring-0 bg-transparent h-10 text-sm"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                      <Smile className="h-4.5 w-4.5" />
                    </Button>
                    <Button 
                      type="button"
                      size="icon" 
                      className="h-9 w-9 shrink-0 rounded-full shadow-lg shadow-primary/20"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 px-3">
                    <span className="text-[10px] text-muted-foreground/60">
                      <span className="font-bold text-foreground/40">Enter</span> pour envoyer
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      <span className="font-bold text-foreground/40">Shift + Enter</span> pour une nouvelle ligne
                    </span>
                  </div>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="h-20 w-20 rounded-3xl bg-muted/20 border border-border/40 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-sm font-medium">Sélectionnez une discussion pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}
