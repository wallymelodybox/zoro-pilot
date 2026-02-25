"use client"

import { useState } from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { getUserById, getPriorityLabel, getTaskStatusLabel, getPriorityColor, type Task } from "@/lib/store"
import {
  List,
  Columns3,
  Calendar,
  Layers,
  Filter,
  ArrowUpDown,
  Search,
  MoreHorizontal,
  Clock,
  User as UserIcon,
  CheckCircle2,
  Users,
  FileText,
  BarChart,
  Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/user-avatar"
import { Input } from "@/components/ui/input"

export default function AllTasksPage() {
  const { tasks, projects, loading } = useSupabaseData()
  const [currentView, setCurrentView] = useState("list")

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Chargement des taches...</div>
  }

  // Filter tasks based on view
  const doneTasks = tasks.filter(t => t.status === "done")
  
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex flex-col border-b bg-background">
         <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Layers className="h-6 w-6" />
               </div>
               <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">Vue Globale</h1>
                  <p className="text-sm text-muted-foreground">Supervision transverse de toute l'organisation</p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-9 h-9" />
               </div>
               <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
               </Button>
               <Button variant="outline" size="sm" className="h-9 gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Trier
               </Button>
            </div>
         </div>

         <div className="px-6 pb-2 overflow-x-auto">
            <Tabs value={currentView} onValueChange={setCurrentView} className="h-9">
              <TabsList className="h-9 bg-transparent p-0 gap-1 w-full justify-start">
                <TabsTrigger value="list" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <List className="h-4 w-4" />
                  Toutes les taches
                </TabsTrigger>
                <TabsTrigger value="kanban" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <Columns3 className="h-4 w-4" />
                  Kanban Global
                </TabsTrigger>
                <TabsTrigger value="planning" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <BarChart className="h-4 w-4" />
                  Planification
                </TabsTrigger>
                <TabsTrigger value="assignments" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <Users className="h-4 w-4" />
                  Affectations
                </TabsTrigger>
                <TabsTrigger value="done" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <Archive className="h-4 w-4" />
                  Taches terminees
                </TabsTrigger>
                <TabsTrigger value="files" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <FileText className="h-4 w-4" />
                  Tous les fichiers
                </TabsTrigger>
              </TabsList>
            </Tabs>
         </div>
      </header>

      {/* Content */}
      <main className="flex-1 bg-muted/10 p-6 overflow-hidden">
         {currentView === "list" && (
            <CardList tasks={tasks} projects={projects} />
         )}
         {currentView === "kanban" && (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
               <Columns3 className="h-8 w-8 opacity-20" />
               <p>Vue Kanban Global : Observer la maturite des taches a l'echelle organisationnelle</p>
            </div>
         )}
         {currentView === "planning" && (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
               <BarChart className="h-8 w-8 opacity-20" />
               <p>Planification des ressources : Equilibrer la charge de travail</p>
            </div>
         )}
         {currentView === "assignments" && (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
               <Users className="h-8 w-8 opacity-20" />
               <p>Affectations : Voir qui fait quoi a l'echelle globale</p>
            </div>
         )}
         {currentView === "done" && (
            <CardList tasks={doneTasks} projects={projects} />
         )}
         {currentView === "files" && (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
               <FileText className="h-8 w-8 opacity-20" />
               <p>Tous les fichiers : Centraliser les ressources documentaires</p>
            </div>
         )}
      </main>
    </div>
  )
}

function CardList({ tasks, projects }: { tasks: Task[], projects: any[] }) {
   return (
      <ScrollArea className="h-full pr-4">
         <div className="space-y-2">
            {tasks.map(task => {
               const project = projects.find(p => p.id === task.projectId)
               const assignee = getUserById(task.assigneeId)
               
               return (
                  <div key={task.id} className="group flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-all hover:border-primary/20">
                     <div className="flex items-center gap-4 flex-1 min-w-0">
                        <CheckCircle2 className={`h-5 w-5 ${task.status === 'done' ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                        <div className="flex flex-col min-w-0">
                           <span className={`font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {task.title}
                           </span>
                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {project && (
                                 <span className="flex items-center gap-1 hover:text-primary cursor-pointer">
                                    <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                                    {project.name}
                                 </span>
                              )}
                              <span>•</span>
                              <span>{getTaskStatusLabel(task.status)}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 min-w-30">
                           {assignee ? (
                              <>
                                 <UserAvatar name={assignee.name} fallback={assignee.avatar} className="h-6 w-6" />
                                 <span className="text-xs text-muted-foreground truncate max-w-20">{assignee.name.split(' ')[0]}</span>
                              </>
                           ) : (
                              <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                 <UserIcon className="h-3 w-3" />
                                 Non assigne
                              </span>
                           )}
                        </div>

                        <div className="flex items-center gap-2 min-w-25">
                           {task.dueDate && (
                              <span className={`text-xs flex items-center gap-1 ${
                                 new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-destructive' : 'text-muted-foreground'
                              }`}>
                                 <Clock className="h-3.5 w-3.5" />
                                 {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                           )}
                        </div>

                        <Badge className={`w-20 justify-center ${getPriorityColor(task.priority)}`} variant="secondary">
                           {getPriorityLabel(task.priority)}
                        </Badge>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                           <MoreHorizontal className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
               )
            })}
         </div>
      </ScrollArea>
   )
}
