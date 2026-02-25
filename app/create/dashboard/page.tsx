"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/app/actions"
import {
  Layout,
  Home,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

export default function CreateDashboardPage() {
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
            <span className="font-semibold text-sm">Tableau de bord</span>
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
             
             {/* Visual Mock - Dashboard */}
             <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3 w-64">
                   <div className="flex gap-3">
                      <div className="bg-white border rounded-lg p-2 flex-1 flex items-center justify-center">
                         <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-orange-300"></div>
                      </div>
                      <div className="bg-white border rounded-lg p-2 flex-1 flex items-center justify-center">
                         <div className="w-8 h-8 rounded-full border-2 border-green-100 flex items-center justify-center text-[10px] font-bold text-green-600">85%</div>
                      </div>
                   </div>
                   <div className="bg-white border rounded-lg p-2 space-y-2">
                      <div className="h-2 w-full bg-linear-to-r from-blue-500 to-green-400 rounded-full"></div>
                      <div className="h-2 w-3/4 bg-blue-400 rounded-full"></div>
                   </div>
                </div>
             </div>

             {/* Description Box */}
             <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Tableau de bord</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                   Un affichage classique du tableau de bord qui vous permet de combiner et rassembler des informations grace a des widgets.
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
