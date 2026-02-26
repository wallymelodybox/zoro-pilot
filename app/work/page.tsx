"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/user-avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChatPanel } from "@/components/chat-panel"
import { useSupabaseData } from "@/hooks/use-supabase"
import {
  objectives,
  users,
  getUserById,
  getPriorityLabel,
  getTaskStatusLabel,
  canEdit as checkCanEdit,
  type Task,
  type TaskStatus,
  type Project,
  getPriorityColor,
  getTaskStatusColor,
} from "@/lib/store"
import {
  List,
  Columns3,
  Calendar,
  Target,
  Link2,
  Clock,
  User as UserIcon,
  AlertTriangle,
  MessageSquare,
  Lock,
  Plus,
  MoreHorizontal,
  Home,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  GanttChart,
  TableProperties,
  UserPlus,
  Settings2,
  CheckCircle2
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// --- TYPES & HELPERS ---

const STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "A faire" },
  { key: "in-progress", label: "En cours" },
  { key: "done", label: "Fait" },
]

// --- COMPONENTS ---

function TaskCard({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const assignee = getUserById(task.assigneeId)
  const linkedKR = task.linkedKRId
    ? objectives
        .flatMap((o) => o.keyResults)
        .find((kr) => kr.id === task.linkedKRId)
    : null

  return (
    <div className={`rounded-lg border bg-card p-3 transition-all group relative shadow-sm hover:shadow-md ${
      canEdit ? "hover:border-primary/30 cursor-pointer" : "opacity-80 border-border/50"
    }`}>
      {!canEdit && (
        <div className="absolute top-2 right-2 text-muted-foreground/20">
          <Lock className="h-3 w-3" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2 pr-4">
        <p className="text-sm font-medium text-foreground font-sans leading-relaxed line-clamp-2">{task.title}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <Badge className={`text-xs px-1.5 py-0 font-sans h-5 ${getPriorityColor(task.priority)}`} variant="secondary">
          {getPriorityLabel(task.priority)}
        </Badge>
        {linkedKR && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 font-sans h-5 gap-1">
            <Link2 className="h-3 w-3" />
            OKR
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {assignee && (
          <div className="flex items-center gap-1.5">
            <UserAvatar name={assignee.name} fallback={assignee.avatar} className="h-5 w-5 text-xs" />
            <span className="text-xs text-muted-foreground font-sans truncate max-w-20">{assignee.name.split(" ")[0]}</span>
          </div>
        )}
        {task.dueDate && (
          <span className="text-xs text-muted-foreground/60 font-mono ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.dueDate.split("-").slice(1).join("/")}
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanBoard({ projectTasks, canEdit }: { projectTasks: Task[]; canEdit: boolean }) {
  return (
    <ScrollArea className="w-full h-full">
      <div className="flex gap-6 pb-4 min-w-full h-full px-1">
        {STATUSES.map((status) => {
          const columnTasks = projectTasks.filter((t) => t.status === status.key)
          return (
            <div key={status.key} className="flex-1 min-w-72 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground font-sans">{status.label}</span>
                  <span className="text-xs text-muted-foreground font-mono rounded-full bg-muted px-2 py-0.5">
                    {columnTasks.length}
                  </span>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col gap-3 flex-1">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} canEdit={canEdit} />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 rounded-lg border border-dashed border-border/50 bg-muted/5">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <LayoutGrid className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Pas de taches</p>
                      <p className="text-xs text-muted-foreground/60">
                        Ajoutez des nouveaux items ou glissez-deposez des items existants ici.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Add Stage Column */}
        {canEdit && (
          <div className="min-w-72 flex flex-col h-full opacity-60 hover:opacity-100 transition-opacity">
             <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
                  Ajouter Etape
                </Button>
             </div>
             <div className="flex-1 rounded-lg border border-dashed border-border/50 bg-muted/5" />
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function MembersColumn({ project }: { project: Project }) {
  const owner = getUserById(project.ownerId)
  // Mock members list - in real app fetch from team
  const members = owner ? [owner] : []

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-foreground font-sans">Membres</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <UserAvatar name={member.name} fallback={member.avatar} className="h-8 w-8" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{member.name}</span>
                <span className="text-xs text-muted-foreground truncate">{member.id === project.ownerId ? 'Proprietaire' : 'Membre'}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2" size="sm">
          <UserPlus className="h-4 w-4" />
          Ajouter un membre
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" size="sm">
          <Settings2 className="h-4 w-4" />
          Gerer les acces
        </Button>
      </div>
    </div>
  )
}

export default function WorkPage() {
  const { projects, tasks, loading, usingMockData } = useSupabaseData()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [currentUserId, setCurrentUserId] = useState<string>("u1") // Default: Sarah Chen (Admin)
  const [currentView, setCurrentView] = useState("kanban")
  
  // Set initial selected project once projects are loaded
  if (projects.length > 0 && !selectedProjectId) {
    setSelectedProjectId(projects[0].id)
  }

  const currentUser = getUserById(currentUserId)
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  // Filter tasks for the selected project locally
  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : []

  // Check permissions
  const canEditProject = currentUser && selectedProject 
    ? checkCanEdit(currentUser, selectedProject.ownerId) 
    : false

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Chargement des projets...</div>
  }

  if (!selectedProject) {
    return <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Aucun projet trouve.</div>
  }

  return (
    <div className="flex h-screen flex-col bg-transparent">
      {/* Header */}
      <header className="flex flex-col border-b bg-card/40 backdrop-blur-md">
        {/* Top Row: Breadcrumb & User */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Home className="h-4 w-4" />
             <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
             <span className="font-medium text-foreground">ZORO PILOT SAS</span>
             <span className="px-1.5 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">Free</span>
             <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
             <span>Projets</span>
           </div>
           
           <div className="flex items-center gap-4">
              {/* Role Switcher for Demo */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Simuler:</span>
                <Select value={currentUserId} onValueChange={setCurrentUserId}>
                  <SelectTrigger className="h-7 w-40 text-xs border-input bg-transparent focus:ring-0">
                    <SelectValue placeholder="Utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
           </div>
        </div>

        {/* Second Row: Title & Views */}
        <div className="flex items-center justify-between px-4 py-3">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{selectedProject.name}</h1>
                <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
              </div>
              
              <Tabs value={currentView} onValueChange={setCurrentView} className="h-8">
                <TabsList className="h-8 bg-transparent p-0 gap-1">
                  <TabsTrigger value="list" className="h-8 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground">
                    <List className="h-4 w-4" />
                    Liste
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="h-8 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground">
                    <Columns3 className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="h-8 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Calendrier
                  </TabsTrigger>
                  <TabsTrigger value="gantt" className="h-8 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground">
                    <GanttChart className="h-4 w-4" />
                    Gantt
                  </TabsTrigger>
                  <TabsTrigger value="table" className="h-8 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground">
                    <TableProperties className="h-4 w-4" />
                    Tableur
                  </TabsTrigger>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                    <Plus className="h-4 w-4" />
                  </Button>
                </TabsList>
              </Tabs>
           </div>

           <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                <ArrowUpDown className="h-4 w-4" />
                Trier
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                <LayoutGrid className="h-4 w-4" />
                Etape
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="ml-2">
                <ChatPanel 
                   contextId={selectedProject.id}
                   trigger={
                     <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                       <MessageSquare className="h-4 w-4" />
                       Chat
                     </Button>
                   }
                 />
              </div>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Members Column */}
        <MembersColumn project={selectedProject} />

        {/* Right Board Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-muted/10 p-6 overflow-hidden">
          {currentView === "kanban" && (
            <KanbanBoard projectTasks={projectTasks} canEdit={canEditProject} />
          )}
          {currentView === "list" && (
            <ProjectTaskList projectTasks={projectTasks} onCanEdit={canEditProject} />
          )}
          {currentView === "calendar" && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Vue calendrier détaillée en cours d&apos;amélioration (les échéances restent visibles dans la
              vue Calendrier globale).
            </div>
          )}
          {currentView === "gantt" && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Vue Gantt en cours de développement.
            </div>
          )}
          {currentView === "table" && (
            <ProjectTaskTable projectTasks={projectTasks} />
          )}
        </main>
      </div>
    </div>
  )
}

function ProjectTaskList({ projectTasks, onCanEdit }: { projectTasks: Task[]; onCanEdit: boolean }) {
  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-2">
        {projectTasks.map((task) => {
          const assignee = getUserById(task.assigneeId)
          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-all",
                !onCanEdit && "opacity-80",
              )}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <CheckCircle2
                  className={cn(
                    "h-5 w-5 cursor-pointer transition-colors",
                    task.status === "done" ? "text-green-500" : "text-muted-foreground/30",
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span
                    className={cn(
                      "font-medium truncate",
                      task.status === "done" ? "line-through text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getTaskStatusLabel(task.status)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-30">
                  {assignee ? (
                    <>
                      <UserAvatar name={assignee.name} fallback={assignee.avatar} className="h-6 w-6" />
                      <span className="text-xs text-muted-foreground truncate max-w-20">
                        {assignee.name.split(" ")[0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      Non assigné
                    </span>
                  )}
                </div>
                <Badge className={cn("w-20 justify-center", getPriorityColor(task.priority))} variant="secondary">
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
            </div>
          )
        })}
        {projectTasks.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground opacity-60">
            Aucune tâche dans ce projet.
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

function ProjectTaskTable({ projectTasks }: { projectTasks: Task[] }) {
  return (
    <div className="h-full bg-card border rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b bg-muted/5 text-xs font-medium text-muted-foreground grid grid-cols-[2fr_1fr_1fr_1fr] gap-2">
        <span>Tâche</span>
        <span>Statut</span>
        <span>Responsable</span>
        <span>Priorité</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {projectTasks.map((task) => {
            const assignee = getUserById(task.assigneeId)
            return (
              <div
                key={task.id}
                className="px-4 py-2 text-sm grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 items-center hover:bg-muted/20"
              >
                <span className={cn("truncate", task.status === "done" && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
                <span className="text-xs text-muted-foreground">{getTaskStatusLabel(task.status)}</span>
                <span className="text-xs text-muted-foreground">
                  {assignee ? assignee.name.split(" ")[0] : "Non assigné"}
                </span>
                <Badge className={cn("justify-center", getPriorityColor(task.priority))} variant="secondary">
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
            )
          })}
          {projectTasks.length === 0 && (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              Aucune tâche à afficher.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
