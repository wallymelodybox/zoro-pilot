"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  ChevronDown
} from "lucide-react"
import Link from "next/link"

export default function CreatePortfolioPage() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    await createProject(formData)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-xl shadow-lg border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <form action={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <Link href="/create" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
              Annuler
            </Link>
            <span className="font-semibold text-sm">Create Portfolio</span>
            <Button 
              type="submit"
              variant="ghost" 
              size="sm" 
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-medium"
              disabled={!name || loading}
            >
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 bg-background max-h-[80vh] overflow-y-auto">
             
             {/* Visual Mock - Briefcase */}
             <div className="flex justify-center mb-6">
                <Briefcase className="h-24 w-24 text-amber-700 fill-amber-700" />
             </div>

             {/* Name Input */}
             <div className="space-y-4">
                <div className="border rounded-lg px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
                   <label className="text-xs text-blue-500 font-medium block">Nom</label>
                   <Input 
                     name="name"
                     className="border-none shadow-none focus-visible:ring-0 p-0 h-6 font-medium"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     autoFocus
                   />
                </div>

                <div className="border rounded-lg px-3 py-2 shadow-sm bg-muted/30">
                   <label className="text-xs text-blue-500 font-medium block">Organisation</label>
                   <div className="text-sm font-medium py-0.5">L'organisation de Menann Zoro</div>
                </div>
             </div>

             {/* Resources Type Selection */}
             <div className="space-y-2">
                <h3 className="text-sm font-medium">Which kind of resources would you like to manage?</h3>
                <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="text-muted-foreground hover:bg-muted cursor-pointer gap-1 py-1.5 px-3 font-normal">
                      <span className="w-3 h-3 border rounded text-[8px] flex items-center justify-center border-muted-foreground">P</span> Projet
                   </Badge>
                   <Badge variant="outline" className="text-muted-foreground hover:bg-muted cursor-pointer gap-1 py-1.5 px-3 font-normal">
                      <span className="w-3 h-3 border rounded text-[8px] flex items-center justify-center border-muted-foreground">L</span> Liste de taches
                   </Badge>
                   <Badge variant="outline" className="text-muted-foreground hover:bg-muted cursor-pointer gap-1 py-1.5 px-3 font-normal">
                      <span className="w-3 h-3 border rounded text-[8px] flex items-center justify-center border-muted-foreground">B</span> Base de donnees
                   </Badge>
                   <Badge variant="outline" className="text-muted-foreground hover:bg-muted cursor-pointer gap-1 py-1.5 px-3 font-normal">
                      <span className="w-3 h-3 border rounded text-[8px] flex items-center justify-center border-muted-foreground">N</span> Notebook
                   </Badge>
                   <Badge variant="outline" className="text-muted-foreground hover:bg-muted cursor-pointer gap-1 py-1.5 px-3 font-normal">
                      <span className="w-3 h-3 border rounded text-[8px] flex items-center justify-center border-muted-foreground">P</span> Process
                   </Badge>
                </div>
             </div>

             {/* Filters */}
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-sm font-medium">Restrict the portfolio to tagged resources</label>
                   <div className="border rounded-lg px-3 py-2.5 shadow-sm bg-white text-sm text-muted-foreground">
                      Aucun tag trouve
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-sm font-medium">Manually select individual resources to include</label>
                   <div className="border rounded-lg px-3 py-2.5 shadow-sm bg-white text-sm flex justify-between items-center">
                      <span>Tout</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-sm font-medium">Manually select individual resources to exclude</label>
                   <div className="border rounded-lg px-3 py-2.5 shadow-sm bg-white text-sm text-muted-foreground">
                      Aucun
                   </div>
                </div>
             </div>

          </div>
        </form>
      </div>
    </div>
  )
}
