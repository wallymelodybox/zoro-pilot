"use client"

import { useSupabaseData } from "@/hooks/use-supabase"
import { Sun, CheckCircle2, Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getPriorityColor, getPriorityLabel } from "@/lib/store"
import { Badge } from "@/components/ui/badge"

export default function MyDayPage() {
  const { tasks, loading } = useSupabaseData()
  
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => t.dueDate === today || t.priority === 'urgent')

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Focus (Optional) */}
      
      <div className="flex-1 flex flex-col relative">
         {/* Background Image/Gradient */}
         <div className="absolute inset-0 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 -z-10" />
         
         <div className="max-w-3xl w-full mx-auto p-8 h-full flex flex-col">
            <header className="mb-8">
               <div className="flex items-center gap-3 mb-2">
                  <Sun className="h-8 w-8 text-amber-500" />
                  <h1 className="text-3xl font-bold text-foreground">Ma journée</h1>
               </div>
               <p className="text-lg text-muted-foreground ml-11">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
               </p>
            </header>

            <ScrollArea className="flex-1 -mx-4 px-4">
               <div className="space-y-4 pb-20">
                  {/* Empty State */}
                  {todayTasks.length === 0 && !loading && (
                     <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-48 h-48 bg-white/50 rounded-full flex items-center justify-center mb-6">
                           <Sun className="h-24 w-24 text-amber-200" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground">Tout est calme pour aujourd'hui</h3>
                        <p className="text-muted-foreground mt-2">Profitez-en pour planifier la suite ou vous reposer.</p>
                        <Button className="mt-6">Planifier des tâches</Button>
                     </div>
                  )}

                  {/* Tasks List */}
                  {todayTasks.map(task => (
                     <div key={task.id} className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border shadow-sm p-4 rounded-xl flex items-center gap-4 group hover:shadow-md transition-all">
                        <button 
                           className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-colors"
                           aria-label={`Marquer la tâche "${task.title}" comme terminée`}
                        >
                           <CheckCircle2 className="h-4 w-4 text-primary opacity-0 hover:opacity-100" />
                        </button>
                        
                        <div className="flex-1">
                           <span className="text-base font-medium text-foreground block">{task.title}</span>
                           <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                 <Calendar className="h-3 w-3" />
                                 Aujourd'hui
                              </span>
                              {task.priority === 'urgent' && (
                                 <span className="text-red-500 font-medium">• Prioritaire</span>
                              )}
                           </div>
                        </div>

                        <Badge className={`${getPriorityColor(task.priority)}`} variant="outline">
                           {getPriorityLabel(task.priority)}
                        </Badge>
                     </div>
                  ))}
                  
                  {/* Add Task Input */}
                  <div className="bg-white/50 dark:bg-card/50 border border-dashed border-primary/30 p-4 rounded-xl flex items-center gap-4 cursor-text hover:bg-white/80 transition-all">
                     <Plus className="h-6 w-6 text-primary" />
                     <span className="text-muted-foreground">Ajouter une tâche à "Ma journée"...</span>
                  </div>
               </div>
            </ScrollArea>
         </div>
      </div>
    </div>
  )
}
