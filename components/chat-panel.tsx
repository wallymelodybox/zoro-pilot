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
} from "lucide-react"
import {
  getUserById,
  getUserChannels,
  getChannelMessages,
  getChannelById,
  getContextChannel,
  type Message,
  type Channel,
  type User,
} from "@/lib/store"
import { cn } from "@/lib/utils"

// --- Fake current user for demo ---
const CURRENT_USER_ID = "u1" // Sarah Chen (Admin)

interface ChatPanelProps {
  contextId?: string // If provided, opens specific context channel
  trigger?: React.ReactNode
}

export function ChatPanel({ contextId, trigger }: ChatPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeChannelId, setActiveChannelId] = React.useState<string | null>(null)
  const [newMessage, setNewMessage] = React.useState("")
  
  // Load initial state
  const userChannels = getUserChannels(CURRENT_USER_ID)
  
  // If contextId is provided, try to find matching channel
  React.useEffect(() => {
    if (contextId && isOpen) {
      const contextChannel = getContextChannel(contextId)
      if (contextChannel) {
        setActiveChannelId(contextChannel.id)
      }
    }
  }, [contextId, isOpen])

  const activeChannel = activeChannelId ? getChannelById(activeChannelId) : null
  const messages = activeChannelId ? getChannelMessages(activeChannelId) : []

  // Mock send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChannelId) return
    
    // In a real app, this would be an API call
    // For now we just clear input to simulate success
    // Ideally we would update the store, but store is readonly in this file context usually
    // We'll just alert for demo
    
    console.log(`Sending message to ${activeChannelId}: ${newMessage}`)
    setNewMessage("")
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
              <div className="p-2 space-y-1">
                {userChannels.map((channel) => (
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
                ))}
              </div>
            </ScrollArea>
          ) : (
            // Message List
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === CURRENT_USER_ID
                    const sender = getUserById(msg.senderId)
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
                          "flex flex-col gap-1",
                          isMe ? "items-end" : "items-start"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {sender?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-lg text-sm",
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-tr-none" 
                              : "bg-muted rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                      Aucun message. Commencez la discussion !
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t bg-background">
                <form 
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                >
                  <Input 
                    placeholder="Ecrire un message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
