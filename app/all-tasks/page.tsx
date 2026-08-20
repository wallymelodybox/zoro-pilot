"use client"

import * as React from "react"
import { useState } from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { useUser } from "@/hooks/use-user"
import { getPriorityLabel, getTaskStatusLabel, getPriorityColor, type Task, type TaskStatus } from "@/lib/store"
import { isOrgAdminOrSuperAdmin } from "@/lib/roles"
import {
  List,
  Columns3,
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
  Archive,
  Plus,
  GripVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/user-avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createTask, updateTaskStatus, updateTaskAssignees, deleteTask } from "@/app/actions"
import { toast } from "sonner"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"

function getTaskProgress(task: Task) {
  if (typeof task.progress === "number") return task.progress
  if (task.status === "done") return 100
  if (task.status === "in-progress") return 50
  return 0
}

function getTaskAssigneeIds(task: Task) {
  return task.assigneeIds && task.assigneeIds.length > 0 ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : []
}

function TaskAssignees({ task, profiles }: { task: Task; profiles: any[] }) {
  const assignees = profiles.filter((profile: any) => getTaskAssigneeIds(task).includes(profile.id))

  if (assignees.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic flex items-center gap-1">
        <UserIcon className="h-3 w-3" />
        Non assignée
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex -space-x-1">
        {assignees.slice(0, 4).map((assignee: any) => (
          <UserAvatar
            key={assignee.id}
            name={assignee.name}
            avatarUrl={assignee.avatar_url}
            fallback={assignee.name?.[0] || "U"}
            className="h-6 w-6 border border-background"
          />
        ))}
      </div>
      <span className="truncate text-xs text-muted-foreground max-w-24">
        {assignees.length === 1 ? assignees[0].name.split(" ")[0] : `${assignees.length} membres`}
      </span>
    </div>
  )
}

export default function AllTasksPage() {
  const { user } = useUser()
  const { tasks, projects, profiles, loading, refresh } = useSupabaseData()
  const [currentView, setCurrentView] = useState("list")

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createStatus, setCreateStatus] = React.useState<TaskStatus>("todo")
  const [createTitle, setCreateTitle] = React.useState("")
  const [createDescription, setCreateDescription] = React.useState("")
  const [createPriority, setCreatePriority] = React.useState("medium")
  const [createDueDate, setCreateDueDate] = React.useState("")
  const [createAssigneeIds, setCreateAssigneeIds] = React.useState<string[]>([])
  const [createVisibility, setCreateVisibility] = React.useState("private")
  const canAssignTasks = isOrgAdminOrSuperAdmin(user?.rbac_role)
  const selectedAssigneeIds = canAssignTasks ? createAssigneeIds : [user?.id || ""].filter(Boolean)

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Chargement des tâches...</div>
  }

  const openCreate = (status: TaskStatus = "todo") => {
    setCreateStatus(status)
    setCreateTitle("")
    setCreateDescription("")
    setCreatePriority("medium")
    setCreateDueDate("")
    setCreateAssigneeIds(user?.id ? [user.id] : [])
    setCreateVisibility("private")
    setIsCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!createTitle.trim()) return

    const fd = new FormData()
    fd.set("title", createTitle)
    fd.set("description", createDescription)
    fd.set("status", createStatus)
    fd.set("priority", createPriority)
    fd.set("projectId", "none")
    selectedAssigneeIds.forEach((id) => fd.append("assigneeIds", id))
    if (selectedAssigneeIds[0]) fd.set("assigneeId", selectedAssigneeIds[0])
    fd.set("visibility", canAssignTasks ? createVisibility : "private")
    if (createDueDate) fd.set("dueDate", createDueDate)

    const res = await createTask(fd)
    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success("Tâche créée")
    setIsCreateOpen(false)
    refresh?.()
  }

  const doneTasks = tasks.filter(t => t.status === "done")

  return (
    <div className="flex h-screen flex-col bg-transparent">
      <header className="flex flex-col border-b bg-card/40 backdrop-blur-md">
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
               <Button size="sm" className="h-9 gap-2" onClick={() => openCreate()}>
                  <Plus className="h-4 w-4" />
                  Ajouter une tâche
               </Button>
            </div>
         </div>

         <div className="px-6 pb-2 overflow-x-auto">
            <Tabs value={currentView} onValueChange={setCurrentView} className="h-9">
              <TabsList className="h-9 bg-transparent p-0 gap-1 w-full justify-start">
                <TabsTrigger value="list" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <List className="h-4 w-4" />
                  Toutes les tâches
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
                  Tâches terminées
                </TabsTrigger>
                <TabsTrigger value="files" className="h-9 px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md gap-2 text-muted-foreground border border-transparent data-[state=active]:border-border">
                  <FileText className="h-4 w-4" />
                  Tous les fichiers
                </TabsTrigger>
              </TabsList>
            </Tabs>
         </div>
      </header>

      <main className="flex-1 bg-transparent p-6 overflow-hidden">
         {currentView === "list" && (
            <CardList tasks={tasks} projects={projects} profiles={profiles} canAssignTasks={canAssignTasks} onRefresh={refresh} />
         )}
         {currentView === "kanban" && (
            <KanbanView tasks={tasks} profiles={profiles} canAssignTasks={canAssignTasks} onRefresh={refresh} />
         )}
         {currentView === "planning" && (
            <PlanningView tasks={tasks} projects={projects} />
         )}
         {currentView === "assignments" && (
            <AssignmentsView tasks={tasks} profiles={profiles} />
         )}
         {currentView === "done" && (
            <CardList tasks={doneTasks} projects={projects} profiles={profiles} canAssignTasks={canAssignTasks} onRefresh={refresh} />
         )}
         {currentView === "files" && (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
               <FileText className="h-8 w-8 opacity-20" />
               <p>Tous les fichiers : Centraliser les ressources documentaires</p>
            </div>
         )}
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Titre"
              autoFocus
            />
            <Textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Description"
              className="min-h-24"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value)}
                placeholder="Priorité (low/medium/high/urgent)"
              />
              <Input
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                type="date"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Statut: {getTaskStatusLabel(createStatus)}
            </div>
            {canAssignTasks && (
              <div className="grid gap-3">
                <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border p-2">
                  {profiles.map((profile: any) => {
                    const checked = createAssigneeIds.includes(profile.id)
                    return (
                      <label key={profile.id} className="flex items-center justify-between rounded-md border bg-background px-2 py-2 text-sm">
                        <span className="truncate">{profile.name}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setCreateAssigneeIds((current) =>
                              event.target.checked
                                ? Array.from(new Set([...current, profile.id]))
                                : current.filter((id) => id !== profile.id)
                            )
                          }}
                        />
                      </label>
                    )
                  })}
                </div>
                <Select value={createVisibility} onValueChange={setCreateVisibility}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Visibilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Privée</SelectItem>
                    <SelectItem value="organization">Organisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!createTitle.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KanbanView({
  tasks,
  profiles,
  canAssignTasks,
  onRefresh,
}: {
  tasks: Task[]
  profiles: any[]
  canAssignTasks: boolean
  onRefresh?: () => void
}) {
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks)
  const [activeTask, setActiveTask] = React.useState<Task | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createStatus, setCreateStatus] = React.useState<TaskStatus>("todo")
  const [createTitle, setCreateTitle] = React.useState("")
  const [createDescription, setCreateDescription] = React.useState("")
  const [createPriority, setCreatePriority] = React.useState("medium")
  const [createDueDate, setCreateDueDate] = React.useState("")
  const [createAssigneeIds, setCreateAssigneeIds] = React.useState<string[]>([])
  const statuses: TaskStatus[] = ["todo", "in-progress", "blocked", "done"]

  React.useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 10,
      } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const openCreate = (status: TaskStatus) => {
    setCreateStatus(status)
    setCreateTitle("")
    setCreateDescription("")
    setCreatePriority("medium")
    setCreateDueDate("")
    setCreateAssigneeIds([])
    setIsCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!createTitle.trim()) return

    const fd = new FormData()
    fd.set("title", createTitle)
    fd.set("description", createDescription)
    fd.set("status", createStatus)
    fd.set("priority", createPriority)
    fd.set("projectId", "none")
    fd.set("visibility", "private")
    createAssigneeIds.forEach((id) => fd.append("assigneeIds", id))
    if (createAssigneeIds[0]) fd.set("assigneeId", createAssigneeIds[0])
    if (createDueDate) fd.set("dueDate", createDueDate)

    const res = await createTask(fd)
    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success("Tâche créée")
    setIsCreateOpen(false)
    onRefresh?.()
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = localTasks.find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = localTasks.find(t => t.id === activeId)
    if (!activeTask) return

    let overStatus: TaskStatus | undefined
    if (statuses.includes(overId as TaskStatus)) {
      overStatus = overId as TaskStatus
    } else {
      const overTask = localTasks.find(t => t.id === overId)
      if (overTask) overStatus = overTask.status
    }

    if (overStatus && activeTask.status !== overStatus) {
      setLocalTasks(prev => {
        return prev.map(t => t.id === activeId ? { ...t, status: overStatus! } : t)
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    let newStatus: TaskStatus | undefined
    if (statuses.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus
    } else {
      const overTask = localTasks.find(t => t.id === overId)
      if (overTask) newStatus = overTask.status
    }

    if (newStatus) {
      const taskInDb = tasks.find(t => t.id === activeId)
      if (taskInDb && taskInDb.status !== newStatus) {
        const res = await updateTaskStatus(activeId, newStatus)
        if (res.error) {
          toast.error(res.error)
          setLocalTasks(tasks)
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={localTasks.filter(t => t.status === status)}
            profiles={profiles}
            canAssignTasks={canAssignTasks}
            onRefresh={onRefresh}
            onAdd={() => openCreate(status)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.4',
            },
          },
        }),
      }}>
        {activeTask ? (
          <div className="p-3 bg-card border rounded-lg shadow-xl cursor-grabbing w-64 rotate-3 scale-105 transition-transform">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight">{activeTask.title}</span>
                <Badge className={cn("shrink-0 scale-75 origin-top-right", getPriorityColor(activeTask.priority))} variant="secondary">
                  {getPriorityLabel(activeTask.priority)}
                </Badge>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Titre"
              autoFocus
            />
            <Textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Description"
              className="min-h-24"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value)}
                placeholder="Priorité (low/medium/high/urgent)"
              />
              <Input
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                type="date"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Statut: {getTaskStatusLabel(createStatus)}
            </div>
            {canAssignTasks && (
              <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border p-2">
                {profiles.map((profile: any) => {
                  const checked = createAssigneeIds.includes(profile.id)
                  return (
                    <label key={profile.id} className="flex items-center justify-between rounded-md border bg-background px-2 py-2 text-sm">
                      <span className="truncate">{profile.name}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setCreateAssigneeIds((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, profile.id]))
                              : current.filter((id) => id !== profile.id)
                          )
                        }}
                      />
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!createTitle.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  )
}

function KanbanColumn({
  status,
  tasks,
  profiles,
  canAssignTasks,
  onRefresh,
  onAdd,
}: {
  status: TaskStatus
  tasks: Task[]
  profiles: any[]
  canAssignTasks: boolean
  onRefresh?: () => void
  onAdd: () => void
}) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className="flex flex-col min-w-75 w-75 h-full bg-muted/20 rounded-xl border border-border/50">
      <div className="p-4 flex items-center justify-between border-b bg-muted/5 rounded-t-xl">
        <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full",
            status === 'todo' ? 'bg-slate-400' : 
            status === 'in-progress' ? 'bg-blue-500' : 
            status === 'blocked' ? 'bg-destructive' : 'bg-green-500'
          )} />
          {getTaskStatusLabel(status)}
          <Badge variant="secondary" className="ml-2 bg-muted-foreground/10 text-muted-foreground font-normal">
            {tasks.length}
          </Badge>
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3">
        <SortableContext
          id={status}
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-20">
            {tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} profiles={profiles} canAssignTasks={canAssignTasks} onRefresh={onRefresh} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

function SortableTaskCard({ task, profiles, canAssignTasks, onRefresh }: { task: Task; profiles: any[]; canAssignTasks: boolean; onRefresh?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const [isOpen, setIsOpen] = React.useState(false)
  const progress = getTaskProgress(task)

  const style = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all",
        isDragging ? "z-50 opacity-50" : "z-auto opacity-100",
        transform ? `[transform:${CSS.Transform.toString(transform)}]` : "",
        transition ? `[transition:${transition}]` : ""
      )}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/40"
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Déplacer"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => setIsOpen((v) => !v)}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium leading-tight">{task.title}</span>
              <Badge className={cn("shrink-0 scale-75 origin-top-right", getPriorityColor(task.priority))} variant="secondary">
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <TaskAssignees task={task} profiles={profiles} />
                {canAssignTasks && (
                  <TaskAssigneeDialog task={task} profiles={profiles} onRefresh={onRefresh} />
                )}
                {task.dueDate && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Progression</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {isOpen && (
              <div className="pt-2 border-t mt-1 text-xs text-muted-foreground space-y-2">
                {task.description ? (
                  <div className="whitespace-pre-wrap">{task.description}</div>
                ) : (
                  <div className="italic">Aucune description</div>
                )}
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}

function TaskAssigneeDialog({ task, profiles, onRefresh }: { task: Task; profiles: any[]; onRefresh?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<string[]>(getTaskAssigneeIds(task))
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) setSelectedIds(getTaskAssigneeIds(task))
  }, [open, task])

  const toggle = (profileId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? Array.from(new Set([...current, profileId]))
        : current.filter((id) => id !== profileId)
    )
  }

  const submit = async () => {
    setSaving(true)
    const res = await updateTaskAssignees(task.id, selectedIds)
    setSaving(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success("Assignations mises à jour")
    setOpen(false)
    onRefresh?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
      >
        <Users className="h-3.5 w-3.5" />
        Assigner
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner la tâche</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="text-sm font-medium">{task.title}</div>
          <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border p-2">
            {profiles.map((profile: any) => {
              const checked = selectedIds.includes(profile.id)
              return (
                <label key={profile.id} className="flex items-center justify-between rounded-md border bg-background px-2 py-2 text-sm">
                  <span className="truncate">{profile.name}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggle(profile.id, event.target.checked)}
                  />
                </label>
              )
            })}
            {profiles.length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun membre disponible.</div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedIds.length} membre(s) sélectionné(s)
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlanningView({ tasks, projects }: { tasks: Task[], projects: any[] }) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  return (
    <div className="h-full bg-card border rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Chronologie des tâches</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">Aujourd'hui</Button>
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8 border-r rounded-none"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="space-y-8">
            {sortedTasks.map((task, i) => {
               const project = projects.find(p => p.id === task.projectId)
               return (
                 <div 
                   key={task.id} 
                   className={cn(
                     "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both",
                     `[animation-delay:${Math.min(i, 15) * 50}ms]`
                   )}
                 >
                   <div className="w-24 shrink-0 text-right">
                     <span className="text-sm font-medium">
                       {task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : "Pas d'échéance"}
                     </span>
                     <div className="text-[10px] text-muted-foreground">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { year: 'numeric' }) : ""}
                     </div>
                   </div>
                   <div className="relative flex-1 pb-8 border-l pl-6 last:pb-0">
                     <div className="absolute -left-1.25 top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                     <div className="p-3 border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-sm font-medium">{task.title}</span>
                           <Badge variant="outline" className="text-[10px] h-4">{project?.name || "Sans projet"}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                           <Badge className={cn("text-[10px] h-4", getPriorityColor(task.priority))} variant="secondary">
                              {getPriorityLabel(task.priority)}
                           </Badge>
                           <span className="text-[10px] text-muted-foreground">{getTaskStatusLabel(task.status)}</span>
                        </div>
                     </div>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function AssignmentsView({ tasks, profiles }: { tasks: Task[]; profiles: any[] }) {
  const groupedTasks: Record<string, Task[]> = {}
  const unassignedTasks: Task[] = []

  tasks.forEach(task => {
    const assigneeIds = getTaskAssigneeIds(task)
    if (assigneeIds.length > 0) {
      assigneeIds.forEach((assigneeId) => {
        if (!groupedTasks[assigneeId]) groupedTasks[assigneeId] = []
        groupedTasks[assigneeId].push(task)
      })
    } else {
      unassignedTasks.push(task)
    }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto h-full pr-2 pb-4">
      {Object.entries(groupedTasks).map(([assigneeId, userTasks], i) => {
        const profile = profiles.find((item: any) => item.id === assigneeId)
        return (
          <div 
            key={assigneeId} 
            className={cn(
              "flex flex-col bg-card border rounded-xl shadow-sm h-fit animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both",
              `[animation-delay:${i * 100}ms]`
            )}
          >
            <div className="p-4 border-b flex items-center gap-3 bg-muted/5">
              <UserAvatar name={profile?.name || "Utilisateur"} avatarUrl={profile?.avatar_url} fallback={profile?.name?.[0] || "U"} className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{profile?.name || "Utilisateur"}</span>
                <span className="text-[10px] text-muted-foreground">{userTasks.length} tâches assignées</span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {userTasks.map(task => (
                <div key={task.id} className="p-2 text-xs border rounded bg-muted/5 hover:bg-muted/10 transition-colors">
                  <div className="font-medium truncate mb-1">{task.title}</div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1">{getTaskStatusLabel(task.status)}</Badge>
                    {task.dueDate && <span className="text-[9px] text-muted-foreground">{new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      
      {unassignedTasks.length > 0 && (
        <div className="flex flex-col bg-card border border-dashed rounded-xl shadow-sm h-fit">
          <div className="p-4 border-b flex items-center gap-3 bg-muted/5">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Non assignées</span>
              <span className="text-[10px] text-muted-foreground">{unassignedTasks.length} tâches</span>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {unassignedTasks.map(task => (
              <div key={task.id} className="p-2 text-xs border rounded bg-muted/5 hover:bg-muted/10 transition-colors">
                <div className="font-medium truncate mb-1">{task.title}</div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1">{getTaskStatusLabel(task.status)}</Badge>
                  {task.dueDate && <span className="text-[9px] text-muted-foreground">{new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CardList({ tasks, projects, profiles, canAssignTasks, onRefresh }: { tasks: Task[], projects: any[], profiles: any[], canAssignTasks: boolean, onRefresh?: () => void }) {
   const [openTaskId, setOpenTaskId] = React.useState<string | null>(null)

   return (
      <ScrollArea className="h-full pr-4">
         <div className="space-y-2">
            {tasks.map((task, i) => {
               const project = projects.find(p => p.id === task.projectId)
               const isOpen = openTaskId === task.id

               return (
                  <div 
                    key={task.id} 
                    className={cn(
                      "group p-3 bg-card border rounded-lg hover:shadow-sm transition-all hover:border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both",
                      `[animation-delay:${Math.min(i, 20) * 40}ms]`
                    )}
                  >
                     <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4 flex-1 min-w-0">
                        <CheckCircle2 
                          className={cn("h-5 w-5 cursor-pointer transition-colors", task.status === 'done' ? 'text-green-500' : 'text-muted-foreground/30 hover:text-green-500/50')} 
                          onClick={async () => {
                            const newStatus = task.status === 'done' ? 'todo' : 'done'
                            const res = await updateTaskStatus(task.id, newStatus)
                            if (!res.error && onRefresh) onRefresh()
                          }}
                        />
                        <button
                          type="button"
                          className="flex flex-col min-w-0 text-left"
                          onClick={() => setOpenTaskId((prev) => (prev === task.id ? null : task.id))}
                        >
                          <span className={cn("font-medium truncate", task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground')}>
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
                        </button>
                     </div>

                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 min-w-36">
                           <TaskAssignees task={task} profiles={profiles} />
                        </div>

                        <div className="flex items-center gap-2 min-w-25">
                           {task.dueDate && (
                              <span className={cn("text-xs flex items-center gap-1", 
                                 new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-destructive' : 'text-muted-foreground'
                              )}>
                                 <Clock className="h-3.5 w-3.5" />
                                 {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                           )}
                        </div>

                        <Badge className={cn("w-20 justify-center", getPriorityColor(task.priority))} variant="secondary">
                           {getPriorityLabel(task.priority)}
                        </Badge>
                        
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:opacity-100 transition-opacity">
                                 <MoreHorizontal className="h-4 w-4" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-48">
                              {canAssignTasks && (
                                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                  <TaskAssigneeDialog task={task} profiles={profiles} onRefresh={onRefresh} />
                                </DropdownMenuItem>
                              )}
                              {canAssignTasks && <DropdownMenuSeparator />}
                              <DropdownMenuItem onClick={async () => {
                                 const res = await updateTaskStatus(task.id, 'done')
                                 if (res.success) {
                                    toast.success("Tâche marquée comme terminée")
                                    if (onRefresh) onRefresh()
                                 }
                              }} disabled={task.status === 'done'}>
                                 Marquer comme fait
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                 const res = await updateTaskStatus(task.id, 'in-progress')
                                 if (res.success) {
                                    toast.success("Tâche en cours")
                                    if (onRefresh) onRefresh()
                                 }
                              }} disabled={task.status === 'in-progress'}>
                                 En cours
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => {
                                 const res = await deleteTask(task.id)
                                 if (res.success) {
                                    toast.success("Tâche supprimée")
                                    if (onRefresh) onRefresh()
                                 }
                              }}>
                                 Supprimer
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                     </div>

                     {isOpen && (
                       <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                         {task.description ? (
                           <div className="whitespace-pre-wrap">{task.description}</div>
                         ) : (
                           <div className="italic">Aucune description</div>
                         )}
                       </div>
                     )}
                  </div>
               )
            })}
         </div>
      </ScrollArea>
   )
}
