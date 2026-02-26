"use client"

import * as React from "react"
import { Search, History, TrendingUp, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

export default function SearchPage() {
  const [query, setQuery] = React.useState("")

  return (
    <div className="flex h-screen flex-col bg-transparent">
      <div className="max-w-4xl w-full mx-auto p-8 flex flex-col h-full gap-8">
        {/* Header Search */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-primary/30 to-fuchsia-500/30 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative flex items-center bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-2 shadow-2xl">
            <Search className="h-6 w-6 ml-3 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher des tâches, projets, documents..." 
              className="border-0 focus-visible:ring-0 bg-transparent text-xl h-12 placeholder:text-muted-foreground/50"
              autoFocus
            />
            {query && (
              <Button variant="ghost" size="icon" onClick={() => setQuery("")} className="mr-2">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
            {/* Recent Searches */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                <History className="h-4 w-4" />
                Recherches récentes
              </div>
              <div className="space-y-1">
                {["Lancement Beta V2", "OKR Q1 2026", "Design System", "Audit Sécurité"].map((item) => (
                  <button key={item} className="w-full text-left px-4 py-3 rounded-xl hover:bg-card/40 transition-colors text-foreground/80 hover:text-foreground">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending / Suggested */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                <TrendingUp className="h-4 w-4" />
                Suggestions IA
              </div>
              <div className="space-y-1">
                {["Projets en retard", "KPI Performance", "Revue stratégique", "Planning Hebdomadaire"].map((item) => (
                  <button key={item} className="w-full text-left px-4 py-3 rounded-xl hover:bg-card/40 transition-colors text-foreground/80 hover:text-foreground flex items-center justify-between">
                    <span>{item}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">IA</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
