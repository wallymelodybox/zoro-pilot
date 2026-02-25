"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useSupabaseData } from "@/hooks/use-supabase"
import { FolderKanban, Plus, LayoutDashboard, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { projects, loading } = useSupabaseData()

  // Simuler des éléments "Utilisé récemment" (pour l'instant statique ou basé sur le dernier projet)
  const recentItems = projects.slice(0, 1)

  if (loading) {
     return <div className="flex items-center justify-center h-screen text-muted-foreground">Chargement...</div>
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header simple */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-background">
        <h1 className="text-2xl font-bold tracking-tight">Nom de l'organisation</h1>
        <div className="flex items-center gap-4">
           <Button variant="ghost" className="gap-2 text-muted-foreground">
             <LayoutDashboard className="h-4 w-4" />
             Basculer vers le tableau de bord
           </Button>
           <Button variant="ghost" size="icon" aria-label="Rechercher">
             <Search className="h-4 w-4" />
           </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8 lg:p-16">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Section: Utilisé récemment */}
          <section className="text-center space-y-6">
            <h2 className="text-2xl font-semibold text-foreground/80">Utilisé récemment</h2>
            <div className="flex justify-center gap-6 flex-wrap">
               {recentItems.length > 0 ? recentItems.map(project => (
                 <Link href="/work" key={project.id} className="group flex flex-col items-center gap-3">
                    <div className="h-24 w-24 rounded-2xl border bg-card shadow-sm group-hover:shadow-md group-hover:border-primary/50 transition-all flex items-center justify-center">
                       <FolderKanban className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {project.name}
                    </span>
                 </Link>
               )) : (
                 <div className="text-muted-foreground text-sm italic">Rien pour le moment</div>
               )}
            </div>
          </section>

          {/* Section: Projets */}
          <section className="text-center space-y-6">
            <h2 className="text-2xl font-semibold text-foreground/80">Projets</h2>
            <div className="flex justify-center gap-8 flex-wrap">
               {projects.map(project => (
                 <Link href="/work" key={project.id} className="group flex flex-col items-center gap-3">
                    <div className="h-24 w-24 rounded-2xl border bg-card shadow-sm group-hover:shadow-md group-hover:border-primary/50 transition-all flex items-center justify-center">
                       <FolderKanban className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors max-w-30 truncate">
                      {project.name}
                    </span>
                 </Link>
               ))}
               
               {/* Bouton Créer */}
               <button className="group flex flex-col items-center gap-3">
                  <div className="h-24 w-24 rounded-2xl border border-dashed bg-muted/30 hover:bg-muted/50 transition-all flex items-center justify-center">
                     <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Créer
                  </span>
               </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
