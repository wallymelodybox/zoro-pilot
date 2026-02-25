"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createProject } from "@/app/actions"
import { toast } from "sonner"
import {
  FolderKanban,
  ChevronRight,
  Plus
} from "lucide-react"
import Link from "next/link"

// Icons for view selection
const ViewIcons = {
  List: () => <div className="w-10 h-6 bg-white border rounded flex items-center gap-1 px-1 shadow-sm"><div className="w-2 h-2 rounded-full border border-blue-500"></div><div className="h-1 w-4 bg-blue-500/50 rounded-full"></div></div>,
  Board: () => <div className="w-10 h-6 bg-white border rounded flex gap-1 p-0.5 shadow-sm"><div className="w-2 h-full bg-blue-500/20 rounded-sm"></div><div className="w-2 h-full bg-blue-500/20 rounded-sm"></div></div>,
}

export default function CreateProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await createProject(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Projet créé avec succès !")
      }
    } catch (e) {
      // In Next.js 14+, redirect() throws an error that is handled by the framework.
      // If we catch it, we might break the redirect. 
      // But we check for it.
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
            <span className="font-semibold text-sm">Créer un projet</span>
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
             
             {/* View Selection Mock */}
             <div className="flex justify-center gap-4 mb-2">
                <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
                   <div className="w-24 h-16 bg-white border rounded-lg shadow-sm flex flex-col p-2 gap-1.5">
                      <div className="flex gap-1"><div className="w-3 h-3 rounded-full border border-purple-500"></div><div className="h-2 w-12 bg-purple-500 rounded"></div></div>
                      <div className="flex gap-1"><div className="w-3 h-3 rounded-full border border-orange-500"></div><div className="h-2 w-8 bg-orange-500 rounded"></div></div>
                      <div className="flex gap-1"><div className="w-3 h-3 rounded-full border border-blue-500"></div><div className="h-2 w-6 bg-blue-500 rounded"></div></div>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-2 cursor-pointer">
                   <div className="w-24 h-16 bg-white border-2 border-blue-500 rounded-lg shadow-md flex gap-1.5 p-2">
                      <div className="flex-1 bg-blue-50 rounded flex flex-col gap-1 p-1">
                         <div className="h-1.5 w-6 bg-blue-200 rounded"></div>
                         <div className="h-1.5 w-full bg-white rounded shadow-sm"></div>
                      </div>
                      <div className="flex-1 bg-purple-50 rounded flex flex-col gap-1 p-1">
                         <div className="h-1.5 w-6 bg-purple-200 rounded"></div>
                         <div className="h-1.5 w-full bg-white rounded shadow-sm"></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Name Input */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 border rounded-lg px-3 py-2 shadow-sm">
                   <FolderKanban className="h-5 w-5 text-blue-500" />
                   <Input 
                     name="name"
                     placeholder="Saisissez un nom pour votre projet." 
                     className="border-none shadow-none focus-visible:ring-0 p-0 h-auto font-medium"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     autoFocus
                   />
                </div>

                <div className="flex items-center justify-between border rounded-lg px-3 py-3 shadow-sm hover:bg-muted/50 cursor-pointer">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-1 rounded">
                         <FolderKanban className="h-4 w-4 text-blue-600" />
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
