"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/app/actions"
import {
  Folder,
  Home,
  Plus
} from "lucide-react"
import Link from "next/link"

export default function CreateFolderPage() {
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
            <span className="font-semibold text-sm">Create Folder</span>
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
             
             {/* Visual Mock - Folder */}
             <div className="flex justify-center mb-6">
                <Folder className="h-24 w-24 text-yellow-200 fill-yellow-200" />
             </div>

             {/* Name Input */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 shadow-sm">
                   <Folder className="h-5 w-5 text-blue-500" />
                   <Input 
                     name="name"
                     placeholder="Enter a name for your folder." 
                     className="border-none shadow-none focus-visible:ring-0 p-0 h-auto font-medium"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     autoFocus
                   />
                </div>

                <div className="flex items-center justify-between border rounded-lg px-3 py-3 shadow-sm hover:bg-muted/50 cursor-pointer">
                   <div className="flex items-center gap-3">
                      <div className="bg-purple-600 p-1.5 rounded text-white">
                         <Home className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs text-blue-500 font-medium">Organisation</span>
                         <span className="text-sm font-medium">L'organisation de Menann Zoro</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Members Section */}
             <div className="space-y-2">
                <h3 className="text-sm font-medium">Membres</h3>
                <div className="border rounded-lg p-3 shadow-sm space-y-3">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">MZ</div>
                      <div className="flex flex-col">
                         <span className="text-sm font-medium">Menann Zoro</span>
                         <span className="text-xs text-muted-foreground">Propriétaire</span>
                      </div>
                   </div>
                   <div className="border-t pt-2">
                      <button type="button" className="flex items-center gap-2 text-blue-500 text-sm font-medium hover:underline">
                         <Plus className="h-4 w-4" />
                         Ajouter un membre
                      </button>
                   </div>
                </div>
             </div>

          </div>
        </form>
      </div>
    </div>
  )
}
