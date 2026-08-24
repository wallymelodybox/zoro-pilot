"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { MobileProjectsScreen } from "@/components/mobile/mobile-projects-screen"
import { useSupabaseData } from "@/hooks/use-supabase"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { createTask, updateTaskStatus, updateTaskProgress, addProjectMember, updateProject, deleteProject, createProjectEvent, createProjectDocument, createCommission, createSubProject } from "@/app/actions"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { isOrgAdminOrSuperAdmin, isOwnerOrSuperAdmin } from "@/lib/roles"
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
  CheckCircle2,
  FolderKanban,
  Paperclip,
  FileText,
  Upload,
  CalendarPlus,
  Flag,
  Timer,
  Users,
  ClipboardList,
  Activity,
  MessageCircle,
  Link as LinkIcon,
  Download,
  CircleDot,
  XCircle,
  CheckCircle,
  CircleAlert,
  CalendarClock,
  NotebookPen,
  Trash2,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// --- TYPES & HELPERS ---

const STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "A faire" },
  { key: "in-progress", label: "En cours" },
  { key: "blocked", label: "Bloqué" },
  { key: "to_validate", label: "A valider" },
  { key: "done", label: "Fait" },
  { key: "cancelled", label: "Annulée" },
]

const KANBAN_COLUMNS: { id: string; status?: TaskStatus; label: string; tone: string }[] = [
  { id: "backlog", status: "todo", label: "Backlog", tone: "bg-slate-500" },
  { id: "todo", status: "todo", label: "À faire", tone: "bg-blue-500" },
  { id: "in-progress", status: "in-progress", label: "En cours", tone: "bg-amber-500" },
  { id: "validation", status: "to_validate", label: "Validation", tone: "bg-violet-500" },
  { id: "blocked", status: "blocked", label: "Bloqué", tone: "bg-red-500" },
  { id: "done", status: "done", label: "Terminé", tone: "bg-emerald-500" },
]

const statusLabels: Record<string, string> = {
  "on-track": "En cours",
  "at-risk": "À risque",
  "off-track": "En retard",
}

const eventLabels: Record<string, string> = {
  meeting: "Réunion",
  deadline: "Deadline",
  milestone: "Milestone",
  reminder: "Rappel",
  event: "Événement",
}

function formatDate(value?: string | null) {
  if (!value) return "Non défini"
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function isOverdue(task: Task) {
  return Boolean(task.isOverdue)
}

function isThisWeek(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return date >= start && date <= end
}

function getTaskAssigneeIds(task: Task) {
  return task.assigneeIds && task.assigneeIds.length > 0 ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : []
}

function getTaskProgress(task: Task) {
  if (typeof task.progress === "number") return task.progress
  if (task.status === "done") return 100
  if (task.status === "in-progress") return 50
  return 0
}

function getProjectProgress(project: Project, tasks: Task[]) {
  if (tasks.length === 0) return project.progress || 0
  return Math.round(tasks.reduce((sum, task) => sum + getTaskProgress(task), 0) / tasks.length)
}

function makeCalendarUrl(title: string, start?: string | null, details?: string) {
  if (!start) return "#"
  const date = new Date(start)
  const end = new Date(date.getTime() + 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(date)}/${fmt(end)}`,
    details: details || "",
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// --- COMPONENTS ---

function ProjectHeader({
  project,
  tasks,
  members,
}: {
  project: Project
  tasks: Task[]
  members: any[]
}) {
  const done = tasks.filter(t => t.status === "done").length
  const calculatedProgress = getProjectProgress(project, tasks)

  return (
    <div className="grid gap-4 border-b bg-card px-6 py-4 xl:grid-cols-[1.25fr_1fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Cockpit projet</div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          </div>
          <Badge
            tone={project.status === "on-track" ? "good" : project.status === "at-risk" ? "warn" : "bad"}
            className="rounded-full"
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {statusLabels[project.status] || project.status}
          </Badge>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Début</div>
            <div className="font-medium">{formatDate(project.startDate)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Deadline</div>
            <div className="font-medium">{formatDate(project.endDate)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Membres actifs</div>
            <div className="font-medium">{members.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tâches</div>
            <div className="font-medium">{done}/{tasks.length} terminées</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 rounded-lg border bg-background p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progression globale</span>
          <span className="font-mono text-lg font-semibold">{calculatedProgress}%</span>
        </div>
        <Progress value={calculatedProgress} className="h-3" />
        <div className="flex -space-x-2">
          {members.slice(0, 6).map(member => (
            <UserAvatar
              key={member.id}
              name={member.name}
              avatarUrl={member.avatar_url}
              fallback={member.name?.[0] || "U"}
              className="h-7 w-7 border-2 border-background"
            />
          ))}
          {members.length > 6 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
              +{members.length - 6}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectKpiStrip({
  tasks,
  events,
  documents,
  profiles,
}: {
  tasks: Task[]
  events: any[]
  documents: any[]
  profiles: any[]
}) {
  const overdue = tasks.filter(isOverdue).length
  const inProgress = tasks.filter(t => t.status === "in-progress").length
  const completed = tasks.filter(t => t.status === "done").length
  const upcoming = [...tasks.filter(t => t.dueDate), ...events].sort((a: any, b: any) => {
    const aDate = new Date(a.dueDate || a.starts_at).getTime()
    const bDate = new Date(b.dueDate || b.starts_at).getTime()
    return aDate - bDate
  })
  const load = profiles.map(profile => ({
    profile,
    count: tasks.filter(t => getTaskAssigneeIds(t).includes(profile.id) && t.status !== "done").length,
  })).sort((a, b) => b.count - a.count)[0]
  const thisWeek = upcoming.filter((item: any) => isThisWeek(item.dueDate || item.starts_at)).length

  const cards = [
    { label: "Tâches", value: tasks.length, hint: `${completed} terminées · ${inProgress} en cours · ${overdue} en retard`, icon: ClipboardList },
    { label: "Activité", value: documents.length + events.length, hint: `${documents.length} document(s) · ${events.length} événement(s)`, icon: Activity },
    { label: "Charge", value: load?.profile?.name?.split(" ")[0] || "Aucune", hint: load ? `${load.count} tâche(s) actives` : "Aucun assigné", icon: Users },
    { label: "Échéances", value: upcoming[0] ? formatDate((upcoming[0] as any).dueDate || (upcoming[0] as any).starts_at) : "Aucune", hint: `${thisWeek} cette semaine`, icon: Timer },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {cards.map(card => (
        <div key={card.label} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 text-xl font-semibold">{card.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{card.hint}</div>
        </div>
      ))}
    </div>
  )
}

function TaskCard({
  task,
  canEdit,
  profiles,
}: {
  task: Task
  canEdit: boolean
  profiles: any[]
}) {
  const assignees = profiles.filter(p => getTaskAssigneeIds(task).includes(p.id))
  const [localProgress, setLocalProgress] = useState(getTaskProgress(task))
  const linkedKR = task.linkedKRId
    ? objectives
        .flatMap((o) => o.keyResults)
        .find((kr) => kr.id === task.linkedKRId)
    : null

  useEffect(() => {
    setLocalProgress(getTaskProgress(task))
  }, [task.id, task.progress, task.status])

  const commitProgress = async () => {
    if (!canEdit || localProgress === getTaskProgress(task)) return
    const res = await updateTaskProgress(task.id, localProgress)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    toast.success("Progression mise à jour")
  }

  return (
    <div
      draggable={canEdit}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
      className={`rounded-lg border bg-card p-3 transition-all group relative shadow-sm hover:shadow-md ${
      canEdit ? "hover:border-primary/30 cursor-pointer" : "opacity-80 border-border/50"
    }`}
    >
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
        {assignees.length > 0 && (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex -space-x-1">
              {assignees.slice(0, 3).map(assignee => (
                <UserAvatar key={assignee.id} name={assignee.name} avatarUrl={assignee.avatar_url} fallback={assignee.name.charAt(0)} className="h-5 w-5 border border-background text-xs" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-sans truncate max-w-24">
              {assignees.length === 1 ? assignees[0].name.split(" ")[0] : `${assignees.length} membres`}
            </span>
          </div>
        )}
        {task.dueDate && (
          <a
            href={makeCalendarUrl(task.title, task.dueDate, task.description)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground/60 font-mono ml-auto flex items-center gap-1 hover:text-foreground"
            title="Ajouter au calendrier"
          >
            <CalendarPlus className="h-3 w-3" />
            {task.dueDate.split("-").slice(1).join("/")}
          </a>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Progression</span>
          <span className="font-mono">{localProgress}%</span>
        </div>
        {canEdit ? (
          <input
            type="range"
            min="0"
            max="100"
            value={localProgress}
            onChange={(event) => setLocalProgress(Number(event.target.value))}
            onBlur={commitProgress}
            onMouseUp={commitProgress}
            onTouchEnd={commitProgress}
            className="h-2 w-full accent-primary"
          />
        ) : (
          <Progress value={localProgress} className="h-2" />
        )}
      </div>
    </div>
  )
}

function KanbanBoard({ 
  projectTasks, 
  canEdit,
  projectId,
  profiles,
  onRefresh
}: { 
  projectTasks: Task[]; 
  canEdit: boolean;
  projectId: string;
  profiles: any[];
  onRefresh: () => void;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<TaskStatus>("todo")
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const handleOpenAdd = (status: TaskStatus) => {
    setTargetStatus(status)
    setNewTitle("")
    setNewDescription("")
    setIsAddOpen(true)
  }

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    
    const fd = new FormData()
    fd.append('title', newTitle)
    fd.append('description', newDescription)
    fd.append('projectId', projectId)
    fd.append('status', targetStatus)
    fd.append('priority', 'medium')
    
    try {
      const res = await createTask(fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success("Tâche ajoutée")
        setIsAddOpen(false)
        onRefresh()
      }
    } catch (err) {
      toast.error("Erreur de création")
    } finally {
      setSaving(false)
    }
  }

  const handleDropTask = async (event: React.DragEvent<HTMLDivElement>, status?: TaskStatus) => {
    event.preventDefault()
    if (!canEdit || !status) return

    const taskId = event.dataTransfer.getData("text/plain")
    const task = projectTasks.find((item) => item.id === taskId)
    if (!task || task.status === status) return

    const res = await updateTaskStatus(task.id, status)
    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success("Statut mis à jour")
    onRefresh()
  }

  return (
    <>
    <ScrollArea className="w-full h-full">
      <div className="flex gap-6 pb-4 min-w-full h-full px-1">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = column.id === "backlog"
            ? projectTasks.filter((t) => t.status === "todo" && !t.dueDate)
            : column.id === "todo"
              ? projectTasks.filter((t) => t.status === "todo" && !!t.dueDate)
              : column.status
                ? projectTasks.filter((t) => t.status === column.status)
                : []
          return (
            <div
              key={column.id}
              className="flex-1 min-w-72 flex flex-col h-full"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDropTask(event, column.status)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", column.tone)} />
                  <span className="text-sm font-medium text-foreground font-sans">{column.label}</span>
                  <span className="text-xs text-muted-foreground font-mono rounded-full bg-muted px-2 py-0.5">
                    {columnTasks.length}
                  </span>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleOpenAdd(column.status && column.status !== "done" ? column.status : "todo")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col gap-3 flex-1">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} canEdit={canEdit} profiles={profiles} />
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
        
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>

    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nouvelle Tâche - {STATUSES.find(s => s.key === targetStatus)?.label}
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouvel élément au projet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Titre</Label>
            <Input 
              placeholder="ex: Finaliser le design..." 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-11 rounded-xl bg-background/50 border-border/40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description (optionnelle)</Label>
            <Textarea 
              placeholder="Détails de la tâche..." 
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="min-h-25 rounded-xl bg-background/50 border-border/40 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl">Annuler</Button>
          <Button onClick={handleCreateTask} disabled={saving || !newTitle.trim()} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
            {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter la tâche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

function MembersColumn({ project, profiles, onRefresh }: { project: Project; profiles: any[]; onRefresh: () => void }) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [adding, setAdding] = useState(false)
  
  const { user } = useUser()

  // Filter profiles that are actually in this project 
  // For now, we'll just show the project owner. 
  // In a real app, you'd have a project_members table.
  const members = profiles.filter(p => p.id === project.ownerId)

  const handleAddMember = async () => {
    if (!selectedMemberId) return
    setAdding(true)
    try {
      const res = await addProjectMember(project.id, selectedMemberId, "Membre")
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Membre ajouté au projet")
        setIsAddMemberOpen(false)
        onRefresh()
      }
    } catch (err) {
      toast.error("Erreur d'ajout")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-foreground font-sans">Membres</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <UserAvatar name={member.name} avatarUrl={member.avatar_url} fallback={member.name.charAt(0)} className="h-8 w-8" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{member.name}</span>
                <span className="text-xs text-muted-foreground truncate">{member.id === project.ownerId ? 'Proprietaire' : 'Membre'}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2" size="sm" onClick={() => setIsAddMemberOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Ajouter un membre
        </Button>
      </div>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Ajouter un membre
            </DialogTitle>
            <DialogDescription>
              Choisissez un membre de l'organisation à ajouter à ce projet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sélectionner un membre</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/40">
                  <SelectValue placeholder="Choisir un collaborateur" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddMemberOpen(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleAddMember} disabled={adding || !selectedMemberId} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
              {adding ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Ajouter au projet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProjectManageDialog({
  project,
  profiles,
  memberIds,
  onRefresh,
}: {
  project: Project
  profiles: any[]
  memberIds: string[]
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [status, setStatus] = useState(project.status)
  const [startDate, setStartDate] = useState(project.startDate || "")
  const [endDate, setEndDate] = useState(project.endDate || "")
  const [progress, setProgress] = useState(project.progress || 0)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(memberIds)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(project.name)
    setStatus(project.status)
    setStartDate(project.startDate || "")
    setEndDate(project.endDate || "")
    setProgress(project.progress || 0)
    setSelectedMemberIds(memberIds)
  }, [open, project, memberIds])

  const submit = async () => {
    const fd = new FormData()
    fd.set("name", name)
    fd.set("status", status)
    fd.set("startDate", startDate)
    fd.set("endDate", endDate)
    fd.set("progress", String(progress))
    selectedMemberIds.forEach(id => fd.append("memberIds", id))

    setSaving(true)
    const res = await updateProject(project.id, fd)
    setSaving(false)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    toast.success("Projet mis à jour")
    setOpen(false)
    onRefresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="h-8 gap-2">
        <Settings2 className="h-4 w-4" />
        Gérer
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
          <DialogDescription>Modifiez les informations et les membres du projet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nom du projet</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-track">En cours</SelectItem>
                  <SelectItem value="at-risk">À risque</SelectItem>
                  <SelectItem value="off-track">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Début</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Deadline</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Progression manuelle</Label>
              <span className="text-sm font-mono text-muted-foreground">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              className="h-2 w-full accent-primary"
            />
          </div>
          <div className="grid gap-2">
            <Label>Membres du projet</Label>
            <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg border p-2 md:grid-cols-2">
              {profiles.map((profile: any) => {
                const checked = selectedMemberIds.includes(profile.id)
                return (
                  <label key={profile.id} className="flex items-center justify-between rounded-md border px-2 py-2 text-sm">
                    <span className="truncate">{profile.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setSelectedMemberIds((current) =>
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
          </div>
        </div>
        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit} disabled={saving || !name.trim()}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProjectButton({
  project,
  onDeleted,
}: {
  project: Project
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const remove = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDeleting(true)
    const res = await deleteProject(project.id)
    setDeleting(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    setOpen(false)
    toast.success("Projet supprimé")
    onDeleted()
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !deleting && setOpen(nextOpen)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Supprimer le projet ${project.name}`}
          title="Supprimer le projet"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {project.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive. Les tâches, sous-projets et données associés seront également supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={remove}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ProjectActionDialog({
  project,
  profiles,
  onRefresh,
  onProjectCreated,
}: {
  project: Project
  profiles: any[]
  onRefresh: () => void
  onProjectCreated: (projectId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"sub-project" | "commission">("sub-project")
  const [name, setName] = useState("")
  const [endDate, setEndDate] = useState("")
  const [managerId, setManagerId] = useState("")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName("")
    setEndDate("")
    setManagerId("")
    setSelectedMemberIds([])
    setMode("sub-project")
  }

  const toggleMember = (profileId: string, checked: boolean) => {
    setSelectedMemberIds((current) =>
      checked
        ? Array.from(new Set([...current, profileId]))
        : current.filter((id) => id !== profileId)
    )
  }

  const submit = async () => {
    const fd = new FormData()
    fd.set("name", name)
    selectedMemberIds.forEach((id) => fd.append("memberIds", id))

    setSaving(true)
    const res = mode === "commission"
      ? await createCommission(fdWithManager(fd, managerId))
      : await createSubProject(project.id, fdWithSubProjectFields(fd, endDate))
    setSaving(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success(mode === "commission" ? "Commission ajoutée" : "Sous-projet ajouté")
    setOpen(false)
    reset()
    onRefresh()

    if (mode === "sub-project" && res?.id) {
      onProjectCreated(res.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value)
      if (!value) reset()
    }}>
      <Button size="sm" className="h-8 rounded-lg font-bold font-sans gap-2 ml-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Action
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle action DG</DialogTitle>
          <DialogDescription>
            Ajoutez une commission ou créez un sous-projet rattaché à {project.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("sub-project")}
              className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", mode === "sub-project" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Sous-projet
            </button>
            <button
              type="button"
              onClick={() => setMode("commission")}
              className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", mode === "commission" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Commission
            </button>
          </div>

          <div className="grid gap-2">
            <Label>{mode === "commission" ? "Nom de la commission" : "Nom du sous-projet"}</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={mode === "commission" ? "ex: Commission finance" : "ex: Phase pilote terrain"} />
          </div>

          {mode === "commission" ? (
            <div className="grid gap-2">
              <Label>Responsable</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger><SelectValue placeholder="Choisir un responsable" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((profile: any) => (
                    <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Deadline</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Membres à assigner</Label>
            <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border p-2 md:grid-cols-2">
              {profiles.map((profile: any) => {
                const checked = selectedMemberIds.includes(profile.id)
                return (
                  <label key={profile.id} className="flex items-center justify-between rounded-md border bg-background px-2 py-2 text-sm">
                    <span className="truncate">{profile.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleMember(profile.id, event.target.checked)}
                    />
                  </label>
                )
              })}
              {profiles.length === 0 && (
                <div className="text-sm text-muted-foreground">Aucun membre disponible dans cette organisation.</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving ? "Création..." : mode === "commission" ? "Ajouter la commission" : "Créer le sous-projet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function fdWithManager(formData: FormData, managerId: string) {
  if (managerId) formData.set("managerId", managerId)
  return formData
}

function fdWithSubProjectFields(formData: FormData, endDate: string) {
  formData.set("status", "on-track")
  if (endDate) formData.set("endDate", endDate)
  return formData
}

export default function WorkPage() {
  const { user } = useUser()
  const { projects, tasks, objectives, profiles, projectEvents, projectDocuments, projectMembers: projectMemberRows, loading, refresh } = useSupabaseData()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [currentView, setCurrentView] = useState("kanban")
  
  // Set initial selected project once projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  // Filter tasks for the selected project locally
  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : []
  const subProjects = selectedProject ? projects.filter(p => p.parentProjectId === selectedProject.id) : []
  const selectedProjectEvents = selectedProject ? projectEvents.filter((event: any) => event.project_id === selectedProject.id) : []
  const selectedProjectDocuments = selectedProject ? projectDocuments.filter((doc: any) => doc.project_id === selectedProject.id) : []
  const projectMemberIds = new Set([
    selectedProject?.ownerId,
    ...(projectMemberRows || [])
      .filter((member: any) => member.project_id === selectedProject?.id)
      .map((member: any) => member.profile_id),
    ...projectTasks.map(task => task.assigneeId),
    ...projectTasks.flatMap(task => getTaskAssigneeIds(task)),
    ...selectedProjectDocuments.map((doc: any) => doc.created_by),
    ...selectedProjectEvents.map((event: any) => event.created_by),
  ].filter(Boolean))
  const projectMembers = profiles.filter(profile => projectMemberIds.has(profile.id))

  // Check permissions
  const isDG = isOrgAdminOrSuperAdmin(user?.rbac_role)
  const canDeleteProject = isOwnerOrSuperAdmin(user?.rbac_role)
  const canEditProject = isDG

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Chargement des projets...</div>
  }

  const mobileScreen = <MobileProjectsScreen projects={projects} tasks={tasks} />

  if (!selectedProject) {
    return (
      <>
        {mobileScreen}
        <div className="hidden md:flex flex-col items-center justify-center h-screen gap-4">
          <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold font-sans">Aucun projet trouvé</h3>
            <p className="text-sm text-muted-foreground font-sans">Créez votre premier projet pour commencer.</p>
          </div>
          {isDG && (
            <Button asChild className="h-11 rounded-xl font-bold font-sans gap-2 px-5 shadow-lg shadow-primary/20 mt-4">
              <Link href="/create/project">
              <Plus className="h-4 w-4" />
              Nouveau Projet
              </Link>
            </Button>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {mobileScreen}
      <div className="hidden md:flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex flex-col border-b bg-card">
        {/* Top Row: Breadcrumb & User */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Home className="h-4 w-4" />
             <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
             <span className="font-medium text-foreground uppercase tracking-wider">{user?.organization_name || "ZORO PILOT"}</span>
             <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
             <span>Projets</span>
           </div>
        </div>

        {/* Second Row: Title & Views */}
        <div className="flex items-center justify-between px-4 py-3">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="h-9 border-none bg-transparent hover:bg-muted/50 transition-colors font-bold text-xl tracking-tight p-0 px-2 focus:ring-0">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id} className="font-sans font-medium">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                </TabsList>
              </Tabs>
           </div>

           <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                <ArrowUpDown className="h-4 w-4" />
                Trier
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Search className="h-4 w-4" />
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
              {isDG && (
                <>
                  <ProjectManageDialog
                    project={selectedProject}
                    profiles={profiles}
                    memberIds={Array.from(projectMemberIds)}
                    onRefresh={refresh}
                  />
                  {canDeleteProject && (
                    <DeleteProjectButton
                      project={selectedProject}
                      onDeleted={() => {
                        setSelectedProjectId(projects.find((project) => project.id !== selectedProject.id)?.id || "")
                        refresh()
                      }}
                    />
                  )}
                  <ProjectActionDialog
                    project={selectedProject}
                    profiles={profiles}
                    onRefresh={refresh}
                    onProjectCreated={setSelectedProjectId}
                  />
                </>
              )}
           </div>
        </div>
        <ProjectHeader project={selectedProject} tasks={projectTasks} members={projectMembers} />
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Right Board Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-muted/30 p-6">
          <ProjectKpiStrip
            tasks={projectTasks}
            events={selectedProjectEvents}
            documents={selectedProjectDocuments}
            profiles={projectMembers}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-h-[520px] rounded-lg border bg-background p-4">
          {currentView === "kanban" && (
            <KanbanBoard 
              projectTasks={projectTasks} 
              canEdit={canEditProject ?? false}
              projectId={selectedProject.id}
              profiles={profiles}
              onRefresh={refresh}
            />
          )}
          {currentView === "list" && (
            <ProjectTaskList projectTasks={projectTasks} onCanEdit={canEditProject ?? false} profiles={profiles} />
          )}
          {currentView === "calendar" && (
            <ProjectAgenda project={selectedProject} tasks={projectTasks} events={selectedProjectEvents} onRefresh={refresh} />
          )}
          </div>
          <ProjectSideRail
            project={selectedProject}
            tasks={projectTasks}
            events={selectedProjectEvents}
            documents={selectedProjectDocuments}
            members={projectMembers}
            allProfiles={profiles}
            subProjects={subProjects}
            onSelectProject={setSelectedProjectId}
            onRefresh={refresh}
          />
          </div>
        </main>
      </div>
      <QuickCreateBar projectId={selectedProject.id} onRefresh={refresh} />
      </div>
    </>
  )
}

function ProjectAgenda({
  project,
  tasks,
  events,
  onRefresh,
}: {
  project: Project
  tasks: Task[]
  events: any[]
  onRefresh: () => void
}) {
  const agendaItems = [
    ...events.map(event => ({
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.starts_at,
      source: "event",
      notes: event.notes,
    })),
    ...tasks.filter(task => task.dueDate).map(task => ({
      id: task.id,
      title: task.title,
      type: "deadline",
      date: task.dueDate,
      source: "task",
      notes: task.description,
    })),
    ...(project.endDate ? [{
      id: `${project.id}-deadline`,
      title: `Deadline projet : ${project.name}`,
      type: "milestone",
      date: project.endDate,
      source: "project",
      notes: "Date de fin du projet",
    }] : []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Agenda projet</h2>
          <p className="text-sm text-muted-foreground">Réunions, deadlines, milestones et rappels internes.</p>
        </div>
        <EventDialog projectId={project.id} onCreated={onRefresh} />
      </div>
      <div className="grid gap-3">
        {agendaItems.map(item => (
          <div key={`${item.source}-${item.id}`} className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {item.type === "meeting" ? <CalendarClock className="h-5 w-5 text-primary" /> : <Flag className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{eventLabels[item.type] || item.type} · {formatDate(item.date)}</div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={makeCalendarUrl(item.title, item.date, item.notes)} target="_blank" rel="noreferrer">
                <CalendarPlus className="h-4 w-4" />
                Ajouter
              </a>
            </Button>
          </div>
        ))}
        {agendaItems.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucun événement ni deadline planifiée.
          </div>
        )}
      </div>
    </div>
  )
}

function EventDialog({ projectId, onCreated }: { projectId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [type, setType] = useState("meeting")
  const [startsAt, setStartsAt] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const fd = new FormData()
    fd.set("projectId", projectId)
    fd.set("title", title)
    fd.set("type", type)
    fd.set("startsAt", startsAt)
    setSaving(true)
    const res = await createProjectEvent(fd)
    setSaving(false)
    if (res?.error) {
      toast.error(res.error)
      return
    }
    toast.success("Événement ajouté")
    setOpen(false)
    setTitle("")
    setStartsAt("")
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Événement
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter à l'agenda</DialogTitle>
          <DialogDescription>Créez un événement interne au projet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Réunion</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="reminder">Rappel</SelectItem>
              <SelectItem value="event">Événement</SelectItem>
            </SelectContent>
          </Select>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !title || !startsAt}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DocumentDialog({ projectId, onCreated }: { projectId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [source, setSource] = useState<"file" | "link">("file")
  const [file, setFile] = useState<File | null>(null)
  const [version, setVersion] = useState("v1")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (source === "file" && !file) return

    let documentUrl = url.trim()
    let uploadedPath: string | null = null
    let fileType = ""

    setSaving(true)
    if (source === "file" && file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 20 Mo.")
        setSaving(false)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Vous devez être connecté pour ajouter un document.")
        setSaving(false)
        return
      }

      const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase()}` : ""
      uploadedPath = `${user.id}/${projectId}/${crypto.randomUUID()}${extension}`
      const { error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload(uploadedPath, file, { contentType: file.type || undefined })

      if (uploadError) {
        const missingBucket = uploadError.message.toLowerCase().includes("bucket not found")
        toast.error(
          missingBucket
            ? "Le stockage des documents n’est pas encore initialisé. Appliquez la migration Supabase 20260715020000_project_documents_storage.sql."
            : `Échec de l’envoi du fichier : ${uploadError.message}`
        )
        setSaving(false)
        return
      }

      documentUrl = supabase.storage.from("project-documents").getPublicUrl(uploadedPath).data.publicUrl
      fileType = file.type || extension.slice(1)
    }

    const fd = new FormData()
    fd.set("projectId", projectId)
    fd.set("name", name.trim())
    fd.set("url", documentUrl)
    fd.set("version", version)
    fd.set("fileType", fileType)
    const res = await createProjectDocument(fd)
    setSaving(false)
    if (res?.error) {
      if (uploadedPath) {
        await createClient().storage.from("project-documents").remove([uploadedPath])
      }
      toast.error(res.error)
      return
    }
    toast.success("Document ajouté")
    setOpen(false)
    setName("")
    setUrl("")
    setFile(null)
    setSource("file")
    setVersion("v1")
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="gap-2">
        <Upload className="h-4 w-4" />
        Document
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>Importez un fichier depuis votre appareil ou ajoutez un lien partagé.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <Button type="button" variant={source === "file" ? "secondary" : "ghost"} onClick={() => setSource("file")}>
              <Upload className="mr-2 h-4 w-4" /> Fichier local
            </Button>
            <Button type="button" variant={source === "link" ? "secondary" : "ghost"} onClick={() => setSource("link")}>
              <LinkIcon className="mr-2 h-4 w-4" /> Lien externe
            </Button>
          </div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du document" />
          {source === "file" ? (
            <div className="grid gap-1.5">
              <Label htmlFor={`project-document-${projectId}`}>Choisir un fichier (20 Mo maximum)</Label>
              <Input
                id={`project-document-${projectId}`}
                type="file"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null
                  setFile(selectedFile)
                  if (selectedFile && !name) setName(selectedFile.name)
                }}
              />
            </div>
          ) : (
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          )}
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !name.trim() || (source === "file" ? !file : !url.trim())}>
            {saving ? "Ajout en cours…" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProjectSideRail({
  project,
  tasks,
  events,
  documents,
  members,
  allProfiles,
  subProjects,
  onSelectProject,
  onRefresh,
}: {
  project: Project
  tasks: Task[]
  events: any[]
  documents: any[]
  members: any[]
  allProfiles: any[]
  subProjects: Project[]
  onSelectProject: (projectId: string) => void
  onRefresh: () => void
}) {
  const recentActivity = [
    ...tasks.slice(0, 4).map(task => ({
      id: task.id,
      icon: ClipboardList,
      text: `${allProfiles.find(p => p.id === task.createdBy)?.name || "Un membre"} a créé une tâche`,
      detail: task.title,
    })),
    ...documents.slice(0, 3).map(doc => ({
      id: doc.id,
      icon: Paperclip,
      text: `${allProfiles.find(p => p.id === doc.created_by)?.name || "Un membre"} a ajouté un document`,
      detail: doc.name,
    })),
    ...events.slice(0, 3).map(event => ({
      id: event.id,
      icon: CalendarClock,
      text: `${allProfiles.find(p => p.id === event.created_by)?.name || "Un membre"} a planifié un événement`,
      detail: event.title,
    })),
  ].slice(0, 6)

  const notifications = [
    ...tasks.filter(isOverdue).map(task => ({ id: task.id, text: `Tâche en retard : ${task.title}`, tone: "bad" as const })),
    ...tasks.filter(task => isThisWeek(task.dueDate)).map(task => ({ id: task.id, text: `Deadline proche : ${task.title}`, tone: "warn" as const })),
  ].slice(0, 5)

  return (
    <aside className="space-y-4">
      <section className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-semibold">Sous-projets</h3>
        <div className="space-y-2">
          {subProjects.map(subProject => (
            <button
              key={subProject.id}
              type="button"
              onClick={() => onSelectProject(subProject.id)}
              className="flex w-full items-center justify-between rounded-md border p-2 text-left hover:bg-muted/50"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{subProject.name}</div>
                <div className="text-xs text-muted-foreground">{formatDate(subProject.endDate)} · {subProject.progress || 0}%</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {subProjects.length === 0 && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Aucun sous-projet rattaché.</div>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Documents projet</h3>
          <DocumentDialog projectId={project.id} onCreated={onRefresh} />
        </div>
        <div className="space-y-2">
          {documents.slice(0, 5).map(doc => (
            <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border p-2 hover:bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{doc.name}</div>
                <div className="text-xs text-muted-foreground">{doc.version || "v1"}</div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
          {documents.length === 0 && <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Aucun document lié.</div>}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-semibold">Membres</h3>
        <div className="space-y-2">
          {members.slice(0, 6).map(member => {
            const memberTasks = tasks.filter(t => getTaskAssigneeIds(t).includes(member.id))
            const active = memberTasks.filter(t => t.status !== "done").length
            const late = memberTasks.filter(isOverdue).length
            const done = memberTasks.filter(t => t.status === "done").length
            const total = memberTasks.length
            const performance = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={member.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar name={member.name} avatarUrl={member.avatar_url} fallback={member.name?.[0] || "U"} className="h-7 w-7" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role || member.rbac_role}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{active} actives</div>
                  <div>{late} retard · {performance}%</div>
                  <Progress value={performance} className="mt-1 h-1.5 w-20" />
                </div>
              </div>
            )
          })}
          {members.length === 0 && <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Aucun membre actif.</div>}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-semibold">Activité récente</h3>
        <div className="space-y-3">
          {recentActivity.map(item => (
            <div key={`${item.text}-${item.id}`} className="flex gap-3 text-sm">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{item.text}</div>
                <div className="truncate text-xs text-muted-foreground">{item.detail}</div>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && <div className="text-sm text-muted-foreground">Aucune activité récente.</div>}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-semibold">Notifications</h3>
        <div className="space-y-2">
          {notifications.map(notification => (
            <Badge key={`${notification.id}-${notification.text}`} tone={notification.tone} className="w-full justify-start rounded-md px-3 py-2">
              {notification.text}
            </Badge>
          ))}
          {notifications.length === 0 && <div className="text-sm text-muted-foreground">Aucune alerte projet.</div>}
        </div>
      </section>
    </aside>
  )
}

function QuickCreateBar({ projectId, onRefresh }: { projectId: string; onRefresh: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-background/95 p-2 shadow-xl backdrop-blur">
        <Button asChild className="rounded-full gap-2">
          <Link href="/create/task">
            <Plus className="h-4 w-4" />
            Tâche
          </Link>
        </Button>
        <EventDialog projectId={projectId} onCreated={onRefresh} />
        <DocumentDialog projectId={projectId} onCreated={onRefresh} />
        <Button variant="outline" className="rounded-full gap-2" disabled>
          <NotebookPen className="h-4 w-4" />
          Note
        </Button>
      </div>
    </div>
  )
}

function ProjectTaskList({ projectTasks, onCanEdit, profiles }: { projectTasks: Task[]; onCanEdit: boolean; profiles: any[] }) {
  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-2">
        {projectTasks.map((task) => {
          const assignees = profiles.filter(p => getTaskAssigneeIds(task).includes(p.id))
          const progress = getTaskProgress(task)
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
                    <span>·</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="mt-2 h-1.5 w-56 max-w-full" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-30">
                  {assignees.length > 0 ? (
                    <>
                      <div className="flex -space-x-1">
                        {assignees.slice(0, 3).map(assignee => (
                          <UserAvatar key={assignee.id} name={assignee.name} avatarUrl={assignee.avatar_url} fallback={assignee.name.charAt(0)} className="h-6 w-6 border border-background" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-20">
                        {assignees.length === 1 ? assignees[0].name.split(" ")[0] : `${assignees.length} membres`}
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
