"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bell,
  Home,
  ChevronRight,
  MoreHorizontal,
  Bookmark,
  MessageSquare,
  AtSign,
  Archive,
  User
} from "lucide-react"

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState("tout")

  const filters = [
    { id: "tout", label: "Tout" },
    { id: "non-lu", label: "Non lu" },
    { id: "mentions", label: "@ Mentions", icon: AtSign },
    { id: "commentaires", label: "Commentaires", icon: MessageSquare },
    { id: "signet", label: "En signet", icon: Bookmark },
    { id: "archive", label: "Archive", icon: Archive },
  ]

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex flex-col border-b bg-background">
        {/* Top Row: Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground border-b border-border/40">
           <Home className="h-4 w-4" />
           <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
           <span className="font-medium text-foreground">Nom de l'organisation</span>
        </div>

        {/* Second Row: Title & Filters */}
        <div className="flex items-center justify-between px-6 py-3">
           <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Boîte de réception</h1>
              
              <div className="flex items-center gap-1">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant="ghost"
                    size="sm"
                    className={`h-8 gap-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === filter.id 
                        ? "bg-secondary text-secondary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setActiveTab(filter.id)}
                  >
                    {filter.icon && <filter.icon className="h-3.5 w-3.5" />}
                    {filter.label}
                  </Button>
                ))}
              </div>
           </div>

           <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground">
                <User className="h-4 w-4" />
                Personne
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
           </div>
        </div>
      </header>

      {/* Main Content Area - Empty State */}
      <main className="flex-1 flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          {/* Stacked Icon Effect */}
          <div className="relative flex items-center justify-center">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-16 h-16 bg-blue-100 rounded-xl opacity-50 blur-sm dark:bg-blue-900/30" />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-16 h-16 bg-blue-200 rounded-xl opacity-70 dark:bg-blue-800/50" />
             <div className="relative z-10 w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg text-white">
               <Bell className="h-8 w-8" fill="currentColor" />
             </div>
          </div>
          
          <p className="text-muted-foreground font-medium text-sm">
            Il n'y a pas de notifications pour le moment.
          </p>
        </div>
      </main>
    </div>
  )
}
