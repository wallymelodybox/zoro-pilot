"use client"

import * as React from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { Sun, CheckCircle2, Plus, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getPriorityColor, getPriorityLabel } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createTask, updateTaskStatus } from "@/app/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function MyDayPage() {
  const { tasks, loading, refresh } = useSupabaseData()
  const [isAdding, setIsAdding] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => t.dueDate === today || t.priority === 'urgent')

  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newTaskTitle.trim() || isSubmitting) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('title', newTaskTitle.trim())
    formData.append('dueDate', today)
    formData.append('priority', 'medium')
    formData.append('status', 'todo')
    formData.append('noRedirect', 'true')

    try {
      const result = await createTask(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setNewTaskTitle("")
        setIsAdding(false)
        toast.success("Tâche ajoutée à Ma journée")
        refresh()
      }
    } catch (err) {
      toast.error("Erreur lors de l'ajout")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    try {
      const result = await updateTaskStatus(taskId, newStatus)
      if (result?.error) {
        toast.error(result.error)
      } else {
        refresh()
      }
    } catch (err) {
      toast.error("Erreur de mise à jour")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col relative">
         {/* Background Image/Gradient */}
         <div className="absolute inset-0 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 -z-10" />
         
         <div className="max-w-3xl w-full mx-auto p-8 h-full flex flex-col">
            <header className="mb-8">
               <div className="flex items-center gap-3 mb-2">
                  <Sun className="h-8 w-8 text-amber-500" />
                  <h1 className="text-3xl font-bold text-foreground">Ma journée</h1>
               </div>
               <p className="text-lg text-muted-foreground ml-11 lowercase">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
               </p>
            </header>

            <ScrollArea className="flex-1 -mx-4 px-4">
               <div className="space-y-4 pb-20">
                  {/* Empty State */}
                  {todayTasks.length === 0 && !loading && (
                     <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-48 h-48 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                           <Sun className="h-24 w-24 text-amber-200" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground">Tout est calme pour aujourd'hui</h3>
                        <p className="text-muted-foreground mt-2">Profitez-en pour planifier la suite ou vous reposer.</p>
                        <Button className="mt-6" onClick={() => setIsAdding(true)}>Planifier des tâches</Button>
                     </div>
                  )}

                  {/* Tasks List */}
                  {todayTasks.map(task => (
                     <div key={task.id} className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border shadow-sm p-4 rounded-xl flex items-center gap-4 group hover:shadow-md transition-all">
                        <button 
                           onClick={() => handleToggleTask(task.id, task.status)}
                           className={cn(
                             "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                             task.status === 'done' 
                               ? "bg-primary border-primary" 
                               : "border-muted-foreground/30 hover:border-primary"
                           )}
                           aria-label={`Marquer la tâche "${task.title}" comme terminée`}
                        >
                           <CheckCircle2 className={cn(
                             "h-4 w-4 transition-opacity",
                             task.status === 'done' ? "text-primary-foreground opacity-100" : "text-primary opacity-0 group-hover:opacity-100"
                           )} />
                        </button>
                        
                        <div className="flex-1">
                           <span className={cn(
                             "text-base font-medium block transition-all",
                             task.status === 'done' ? "text-muted-foreground line-through" : "text-foreground"
                           )}>{task.title}</span>
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
                  
                  {/* Add Task Section */}
                  <div className="mt-4">
                    {isAdding ? (
                      <form onSubmit={handleAddTask} className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-2 border-primary/30 p-4 rounded-xl shadow-lg transition-all ring-2 ring-primary/10">
                        <div className="flex items-center gap-4">
                          <Plus className="h-6 w-6 text-primary shrink-0" />
                          <Input 
                            autoFocus
                            placeholder="Ajouter une tâche à 'Ma journée'..."
                            className="border-none bg-transparent focus-visible:ring-0 text-base p-0 h-auto"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onBlur={() => {
                              if (!newTaskTitle.trim()) setIsAdding(false)
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-7 gap-1 text-[10px] bg-primary/5 border-primary/20">
                              <Calendar className="h-3 w-3" />
                              Aujourd'hui
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button 
                               type="button" 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => {
                                 setNewTaskTitle("")
                                 setIsAdding(false)
                               }}
                               disabled={isSubmitting}
                             >
                               Annuler
                             </Button>
                             <Button 
                               type="submit" 
                               size="sm" 
                               disabled={!newTaskTitle.trim() || isSubmitting}
                               className="px-4"
                             >
                               {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                             </Button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="w-full bg-white/50 dark:bg-card/50 border border-dashed border-primary/30 p-4 rounded-xl flex items-center gap-4 cursor-text hover:bg-white/80 dark:hover:bg-card/80 transition-all text-left"
                      >
                         <Plus className="h-6 w-6 text-primary" />
                         <span className="text-muted-foreground font-medium">Ajouter une tâche à "Ma journée"...</span>
                      </button>
                    )}
                  </div>
               </div>
            </ScrollArea>
         </div>
      </div>
    </div>
  )
}
