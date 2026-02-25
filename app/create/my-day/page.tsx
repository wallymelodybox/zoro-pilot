"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/app/actions"
import {
  Sun,
  Home,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

export default function CreateMyDayPage() {
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
            <span className="font-semibold text-sm">Ma journée</span>
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
             
             {/* Visual Mock - My Day */}
             <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-center relative w-32 h-32">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <Sun className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                   </div>
                   {/* Abstract background blobs */}
                   <div className="absolute top-4 left-4 w-8 h-4 bg-yellow-100 rounded-full opacity-50"></div>
                   <div className="absolute bottom-6 right-6 w-10 h-10 bg-orange-50 rounded-lg opacity-50"></div>
                </div>
             </div>

             {/* Description Box */}
             <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">Ma journée</h3>
                <p className="text-xs text-yellow-700 leading-relaxed">
                   Planifiez et visualisez tout ce qui doit être fait aujourd'hui.
                </p>
             </div>

             {/* Name Input */}
             <div className="space-y-4">
                <div className="border rounded-lg px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-yellow-500">
                   <label className="text-xs text-yellow-600 font-medium block">Nom</label>
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
                      <Home className="h-5 w-5 text-yellow-500" />
                      <div className="flex flex-col">
                         <span className="text-xs text-yellow-600 font-medium">Lieu</span>
                         <span className="text-sm font-medium">L'organisation de Menann Zoro</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-0.5">
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
