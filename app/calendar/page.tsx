"use client"

import { useSupabaseData } from "@/hooks/use-supabase"
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CalendarPage() {
  const { tasks, loading } = useSupabaseData()
  
  // Mock calendar grid generation would go here
  const days = Array.from({ length: 35 }, (_, i) => i + 1) // Simple 5-week grid mock

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
         <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
               <CalendarDays className="h-6 w-6" />
            </div>
            <div>
               <h1 className="text-xl font-bold tracking-tight text-foreground">Calendrier Global</h1>
               <p className="text-sm text-muted-foreground">Planification inter-projets</p>
            </div>
         </div>
         
         <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-md p-0.5 border">
               <Button variant="ghost" size="sm" className="h-7 px-2">Mois</Button>
               <Button variant="ghost" size="sm" className="h-7 px-2 bg-background shadow-sm">Semaine</Button>
               <Button variant="ghost" size="sm" className="h-7 px-2">Jour</Button>
            </div>
            <div className="flex items-center gap-1 ml-4">
               <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               <span className="text-sm font-medium w-32 text-center">Fevrier 2026</span>
               <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </div>
            <Button size="sm" className="ml-4 gap-2">
               <Plus className="h-4 w-4" />
               Evenement
            </Button>
         </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 bg-muted/10">
         <div className="h-full bg-background rounded-xl border shadow-sm flex flex-col">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b">
               {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="p-3 text-sm font-medium text-center text-muted-foreground border-r last:border-r-0">
                     {day}
                  </div>
               ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5">
               {days.map((day, i) => (
                  <div key={i} className="border-b border-r p-2 min-h-25 relative group hover:bg-muted/5">
                     <span className="text-sm font-medium text-muted-foreground p-1 block">{i % 30 + 1}</span>
                     
                     {/* Mock Event */}
                     {i === 4 && (
                        <div className="mt-1 bg-blue-100 text-blue-700 text-xs p-1.5 rounded border border-blue-200 truncate cursor-pointer hover:opacity-80">
                           Reunion lancement
                        </div>
                     )}
                     {i === 12 && (
                        <div className="mt-1 bg-purple-100 text-purple-700 text-xs p-1.5 rounded border border-purple-200 truncate cursor-pointer hover:opacity-80">
                           Livraison Beta
                        </div>
                     )}
                  </div>
               ))}
            </div>
         </div>
      </main>
    </div>
  )
}
