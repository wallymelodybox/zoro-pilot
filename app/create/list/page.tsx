"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/app/actions"
import { toast } from "sonner"
import {
  ListTodo,
  ChevronRight,
  Folder,
  Plus
} from "lucide-react"
import Link from "next/link"

export default function CreateListPage() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await createProject(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Liste créée avec succès !")
      }
    } catch (e) {
      if (e instanceof Error && e.message === "NEXT_REDIRECT") {
        throw e;
      }
      console.error(e)
      toast.error("Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
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
            <span className="font-semibold text-sm">Créer une liste de tâches</span>
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
             
             {/* Visual Mock */}
             <div className="flex justify-center mb-4">
                <div className="relative">
                   <div className="absolute -top-4 -right-10 w-16 h-10 bg-blue-100 rounded-lg transform rotate-6 opacity-50"></div>
                   <div className="absolute -top-2 -left-8 w-16 h-12 bg-pink-100 rounded-lg transform -rotate-6 opacity-50"></div>
                   <div className="bg-white border shadow-sm rounded-lg p-3 w-48 space-y-2 relative z-10">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full border border-red-400"></div>
                         <div className="h-2 w-20 bg-linear-to-r from-red-400 to-pink-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full border border-blue-400"></div>
                         <div className="h-2 w-10 bg-blue-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2 opacity-50">
                         <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                         <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Name Input */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 shadow-sm">
                   <div className="bg-blue-500 p-1 rounded text-white">
                      <ListTodo className="h-4 w-4" />
                   </div>
                   <Input 
                     name="name"
                     placeholder="Saisissez un nom pour votre liste de tâches." 
                     className="border-none shadow-none focus-visible:ring-0 p-0 h-auto font-medium"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     autoFocus
                   />
                </div>

                <div className="flex items-center justify-between border rounded-lg px-3 py-3 shadow-sm hover:bg-muted/50 cursor-pointer">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-1 rounded">
                         <Folder className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs text-blue-500 font-medium">Dossier</span>
                         <span className="text-sm font-medium">Projets</span>
                      </div>
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground -rotate-90" />
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
