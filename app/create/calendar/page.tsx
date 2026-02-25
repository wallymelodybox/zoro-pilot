"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/app/actions"
import {
  Calendar,
  Home,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

export default function CreateCalendarPage() {
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
            <span className="font-semibold text-sm">Calendrier</span>
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
          <div className="p-6 space-y-6 bg-background">
             
             {/* Visual Mock - Calendar */}
             <div className="flex justify-center mb-4">
                <div className="bg-muted/20 p-2 rounded-xl">
                   <div className="grid grid-cols-4 gap-2">
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground">14</div>
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground">15</div>
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground relative">
                         16
                         <div className="absolute top-4 left-1 right-1 h-1.5 bg-purple-500 rounded-full"></div>
                         <div className="absolute top-6 left-1 -right-5 h-1.5 bg-red-400 rounded-full z-10"></div>
                      </div>
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground">17</div>
                      
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground">24</div>
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground relative">
                         25
                         <div className="absolute top-4 left-1 right-1 h-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground">26</div>
                      <div className="w-10 h-10 bg-muted rounded-lg p-1 text-[8px] text-muted-foreground">27</div>
                   </div>
                </div>
             </div>

             {/* Description Box */}
             <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Calendrier</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                   Programmez des taches et des items depuis n'importe ou dans un seul calendrier.
                </p>
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

                <div className="flex items-center justify-between border rounded-lg px-3 py-3 shadow-sm hover:bg-muted/50 cursor-pointer">
                   <div className="flex items-center gap-3">
                      <Home className="h-5 w-5 text-blue-500" />
                      <div className="flex flex-col">
                         <span className="text-xs text-blue-500 font-medium">Lieu</span>
                         <span className="text-sm font-medium">L'organisation de Menann Zoro</span>
                      </div>
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground -rotate-90" />
                   </div>
                </div>
             </div>

          </div>
        </form>
      </div>
    </div>
  )
}
