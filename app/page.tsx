"use client"

import * as React from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { 
  FolderKanban, 
  Plus, 
  LayoutDashboard, 
  Search, 
  ChevronDown, 
  CheckCircle2, 
  PlusCircle, 
  CalendarDays,
  Filter,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "@/components/user-avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { WidgetHub, WIDGETS } from "@/components/widget-hub"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'

interface DraggableWidgetProps {
  id: string
  children: React.ReactNode
  className?: string
}

type WidgetSize = "small" | "medium" | "large"

interface DashboardWidgetConfig {
  id: string
  size: WidgetSize
}

function GenericWidget({ id, isOverlay = false }: { id: string, isOverlay?: boolean }) {
  const widget = WIDGETS.find(w => w.id === id)
  if (!widget) return null

  const getAccentColor = (cat: string) => {
    switch (cat) {
      case 'Diagrammes': return 'text-blue-500 bg-blue-500/10'
      case 'Listes': return 'text-purple-500 bg-purple-500/10'
      case 'Calendrier': return 'text-emerald-500 bg-emerald-500/10'
      case 'Utilitaires': return 'text-orange-500 bg-orange-500/10'
      default: return 'text-muted-foreground bg-muted/10'
    }
  }

  const accent = getAccentColor(widget.cat)

  return (
    <div className={cn(
      "bg-card/50 border rounded-3xl p-6 flex flex-col min-h-[220px] h-full transition-all hover:bg-card/80",
      isOverlay && "shadow-2xl border-primary/50"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold truncate pr-2">{widget.title}</h2>
        <Badge variant="secondary" className={cn("text-[10px] uppercase tracking-wider border-none px-2", accent)}>
          {widget.cat}
        </Badge>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 text-center gap-4 py-2">
        <div className="scale-90 transition-transform group-hover:scale-95 duration-300">
          {widget.preview}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] max-w-[200px] leading-relaxed text-muted-foreground/40 italic">
            Connecté au flux de données
          </p>
          <div className="flex justify-center gap-1">
            <div className="h-1 w-1 rounded-full bg-primary/20 animate-pulse" />
            <div className="h-1 w-1 rounded-full bg-primary/20 animate-pulse delay-75" />
            <div className="h-1 w-1 rounded-full bg-primary/20 animate-pulse delay-150" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DraggableWidget({ id, children, className }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group", 
        isDragging ? "z-50 opacity-30" : "z-auto opacity-100",
        className
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20 p-2 bg-muted/80 rounded-lg hover:bg-primary/20 hover:text-primary"
        title="Faire glisser pour réorganiser"
      >
        <div className="grid grid-cols-2 gap-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-current rounded-full" />
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const { projects, tasks, objectives, loading } = useSupabaseData()
  const [isWidgetHubOpen, setIsWidgetHubOpen] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [widgetOrder, setWidgetOrder] = React.useState([
    'projects-widget',
    'status-widgets',
    'progress-widget',
    'calendar-widget'
  ])
  const [widgetConfigs, setWidgetConfigs] = React.useState<Record<string, DashboardWidgetConfig>>({})

  const onToggleWidget = (id: string, config?: { size?: WidgetSize }) => {
    setWidgetOrder(current =>
      current.includes(id)
        ? current.filter(w => w !== id)
        : [...current, id],
    )
    if (config?.size) {
      setWidgetConfigs((prev) => ({
        ...prev,
        [id]: { id, size: config.size || "medium" },
      }))
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) {
     return <div className="flex items-center justify-center h-screen text-muted-foreground">Chargement...</div>
  }

  const renderWidget = (id: string, isOverlay = false) => {
    const content = () => {
      switch (id) {
        case 'projects-widget':
          return (
            <div className="bg-card/50 border rounded-3xl p-6 h-150 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Projets</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href="/create/project">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {projects.map(project => (
                    <div key={project.id} className="group p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                             <FolderKanban className="h-4 w-4" />
                           </div>
                           <span className="font-semibold text-sm">{project.name}</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] px-2 py-0 h-5 gap-1 border-none">
                          <div className="h-1 w-1 rounded-full bg-green-500" />
                          Projets
                        </Badge>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/10 text-xs text-muted-foreground italic text-center">
                        Pas de tâches, pour le moment
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                      <FolderKanban className="h-12 w-12 mb-2" />
                      <p className="text-sm">Aucun projet actif</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )
        case 'status-widgets': {
          const todayTasks = tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0])
          const doneToday = todayTasks.filter(t => t.status === 'done').length
          const totalToday = todayTasks.length
          const progressToday = totalToday > 0 ? (doneToday / totalToday) * 100 : 0

          let ringClass = "status-ring-0"
          if (progressToday > 0 && progressToday <= 25) ringClass = "status-ring-1"
          else if (progressToday > 25 && progressToday <= 50) ringClass = "status-ring-2"
          else if (progressToday > 50 && progressToday <= 75) ringClass = "status-ring-3"
          else if (progressToday > 75) ringClass = "status-ring-4"

          return (
            <div className="space-y-6 h-full">
              <div className="grid grid-cols-2 gap-4">
                {/* Ma journée */}
                <Link href="/my-day" className="bg-card/50 border rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-center h-44 hover:bg-muted/20 transition-colors">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ma journée</h3>
                  <div className="h-20 w-20 rounded-full border-4 border-blue-500/30 flex items-center justify-center relative">
                     <div 
                       className={cn(
                         "absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent transition-transform duration-700",
                         "status-ring",
                         ringClass
                       )}
                     />
                     <div className="flex flex-col items-center">
                        <span className="text-xl font-bold">{doneToday}/{totalToday}</span>
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                     </div>
                  </div>
                </Link>
                {/* Ma semaine */}
                <div className="bg-card/50 border rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-center h-44">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ma semaine</h3>
                  <div className="h-20 w-20 rounded-full border-4 border-blue-500/30 flex items-center justify-center relative">
                     <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent border-r-transparent rotate-90" />
                     <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* État d'avancement Chart */}
              <div className="bg-card/50 border rounded-3xl p-6 h-82.5 flex flex-col">
                <h2 className="text-sm font-semibold mb-10">État d'avancement des tâches par projet</h2>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-3">
                   <div className="h-24 w-32 border-b-2 border-l-2 border-current relative">
                      <div className="absolute bottom-4 left-2 right-4 h-12 border-t-2 border-r-2 border-current rounded-tr-lg" />
                   </div>
                   <span className="text-xs font-medium uppercase tracking-widest">Aucun résultat</span>
                </div>
              </div>
            </div>
          )
        }
        case 'progress-widget':
          const displayObjectives = objectives.slice(0, 3)
          return (
            <div className="bg-card/50 border rounded-3xl p-6 h-80 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold">Progression des Objectifs</h2>
                </div>
                <Badge variant="outline" className="bg-orange-500/5 text-orange-500 border-orange-500/20">
                  T1 2026
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {displayObjectives.map(obj => (
                  <div key={obj.id} className="space-y-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground truncate max-w-40">{obj.title}</span>
                      <span>{obj.progress}%</span>
                    </div>
                    <Progress value={obj.progress} className="h-2 command-center-progress" />
                  </div>
                ))}
                {displayObjectives.length === 0 && (
                  <p className="col-span-3 text-center text-muted-foreground py-10">Aucun objectif stratégique défini.</p>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {objectives.filter(o => o.confidence === 'on-track').length} sains
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                    {objectives.filter(o => o.confidence === 'at-risk').length} à risque
                  </span>
                </div>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                  <Link href="/strategy">Voir la Strategy Map</Link>
                </Button>
              </div>
            </div>
          )
        case 'calendar-widget':
          return (
            <div className="bg-card/50 border rounded-3xl p-6 h-150 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold">Jour</h2>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Aujourd'hui</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 text-xl font-bold">
                   <span>{today.toLocaleDateString('fr-FR', { month: 'long' })}</span>
                   <span>{today.getFullYear()}</span>
                   <span className="text-muted-foreground/40 font-normal ml-2 text-sm">(CW {Math.ceil(today.getDate() / 7)})</span>
                </div>
                <div className="flex items-center gap-4 mt-6">
                   <span className="text-3xl font-bold text-blue-500">{today.getDate()}</span>
                   <span className="text-sm font-medium text-blue-500">{today.toLocaleDateString('fr-FR', { weekday: 'long' })}</span>
                </div>
              </div>

              {/* Timeline Placeholder */}
              <div className="flex-1 border-t relative">
                 {[1, 2, 3, 4, 5, 6].map(hour => (
                   <div key={hour} className="h-16 border-b flex items-center">
                      <span className="text-[10px] text-muted-foreground/50 font-mono">0{hour}:00</span>
                   </div>
                 ))}
                 {/* Current Time Indicator */}
                 <div className="absolute top-48 left-0 right-0 h-px bg-blue-500 z-10 flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 -ml-1" />
                 </div>
              </div>
            </div>
          )
        default:
          return <GenericWidget id={id} isOverlay={isOverlay} />
      }
    }

    if (isOverlay) {
      return (
        <div className={cn(
          id === 'projects-widget' ? "col-span-5" : 
          id === 'status-widgets' ? "col-span-4" : 
          id === 'progress-widget' ? "col-span-12" : 
          id === 'calendar-widget' ? "col-span-3" :
          "col-span-4"
        )}>
          {content()}
        </div>
      )
    }

    const baseClass = cn(
      id === 'projects-widget' ? "col-span-12 lg:col-span-5" : 
      id === 'status-widgets' ? "col-span-12 lg:col-span-4" : 
      id === 'progress-widget' ? "col-span-12 lg:col-span-12" : 
      id === 'calendar-widget' ? "col-span-12 lg:col-span-3" :
      "col-span-12 lg:col-span-4"
    )

    const cfg = widgetConfigs[id]
    const sizedClass = cfg?.size === "small"
      ? "col-span-12 lg:col-span-3"
      : cfg?.size === "large"
        ? "col-span-12 lg:col-span-12"
        : baseClass

    return (
      <DraggableWidget 
        key={id} 
        id={id} 
        className={sizedClass}
      >
        {content()}
      </DraggableWidget>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto w-full px-8 py-10 space-y-10">
          
          {/* Header Section */}
          <div className="command-center-header relative flex flex-col items-center text-center space-y-4 rounded-3xl border border-border/40 bg-gradient-to-b from-background/40 to-background/5 px-6 py-8 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" />
            <span className="relative text-sm font-medium text-muted-foreground/80 lowercase">{dateStr}</span>
            <h1 className="relative text-4xl font-bold tracking-tight text-foreground">
              Bonjour, Menann Zoro !
            </h1>
            
            {/* Action Pills */}
            <div className="relative flex items-center gap-3 pt-3">
               <button className="command-center-avatar flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border hover:bg-muted transition-colors text-sm font-medium">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full border border-primary/40 animate-command-center-avatar-glow" />
                    <UserAvatar name="Menann Zoro" fallback="MZ" className="h-7 w-7" />
                  </div>
                  Profil
               </button>
               <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border hover:bg-muted transition-colors text-sm font-medium">
                  <div className="h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                  </div>
                  L'organisation de Menann Zoro
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
               </button>
               <button 
                 onClick={() => setIsWidgetHubOpen(true)}
                 className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border hover:bg-muted transition-colors text-sm font-medium"
               >
                  <Plus className="h-4 w-4" />
                  Ajouter un widget
               </button>
               <Link 
                 href="/work"
                 className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border hover:bg-muted transition-colors text-sm font-medium"
               >
                  <LayoutDashboard className="h-4 w-4" />
                  Basculer vers l'affichage classique
               </Link>
            </div>
          </div>

          {/* Draggable Grid Layout */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
          >
            <SortableContext
              items={widgetOrder}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-12 gap-6">
                {widgetOrder.map(id => renderWidget(id))}
              </div>
            </SortableContext>

            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.4',
                    },
                  },
                }),
              }}
            >
              {activeId ? (
                <div 
                  className={cn(
                    "opacity-90 scale-105 transition-transform pointer-events-none max-w-[1200px]",
                    activeId === "progress-widget"
                      ? "w-[min(1100px,90vw)]"
                      : activeId === "projects-widget"
                        ? "w-[400px]"
                        : activeId === "status-widgets"
                          ? "w-[320px]"
                          : "w-[280px]"
                  )}
                >
                  {renderWidget(activeId, true)}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Right Sidebar: Items (Floating Style) */}
      <aside className="w-80 border-l bg-background flex flex-col h-screen shrink-0">
         <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-semibold text-lg">Items</h2>
         </div>
         
         <div className="p-4 px-6">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-muted-foreground border border-transparent hover:border-border">
               <Filter className="h-4 w-4" />
               Tous les items
            </button>
         </div>

         <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
               {tasks.slice(0, 10).map(task => (
                 <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-transparent hover:border-border transition-all cursor-pointer">
                    <CheckCircle2 className={cn("h-4 w-4 mt-0.5", task.status === 'done' ? "text-green-500" : "text-muted-foreground/30")} />
                    <div className="flex flex-col gap-1 min-w-0">
                       <span className={cn("text-xs font-medium truncate", task.status === 'done' && "line-through text-muted-foreground")}>
                          {task.title}
                       </span>
                       <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn("text-[9px] h-3.5 px-1 bg-muted/50 border-none", 
                             task.priority === 'urgent' ? "text-red-500" : 
                             task.priority === 'high' ? "text-orange-500" : "text-muted-foreground"
                          )}>
                             {task.priority}
                          </Badge>
                       </div>
                    </div>
                 </div>
               ))}
               {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-40">
                     <div className="h-20 w-20 relative">
                        <div className="absolute inset-0 flex flex-col gap-2 p-3">
                           <div className="h-1 w-full bg-blue-500 rounded-full" />
                           <div className="h-1 w-2/3 bg-muted rounded-full" />
                           <div className="h-1 w-1/2 bg-muted rounded-full" />
                        </div>
                        <div className="absolute inset-0 border-2 border-dashed rounded-xl" />
                     </div>
                     <p className="text-xs font-medium">Pas de tâches</p>
                  </div>
               )}
            </div>
         </ScrollArea>

         <div className="p-6 mt-auto space-y-4">
            <Button className="w-full h-12 rounded-2xl bg-muted/20 hover:bg-muted/40 text-foreground border border-muted-foreground/10 justify-start gap-3 px-4 transition-all hover:scale-[1.02]" variant="ghost">
               <PlusCircle className="h-5 w-5 text-blue-500" />
               Créer une tâche
            </Button>
            
            <Link 
               href="/create/project"
               className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-3 font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20"
            >
               <Plus className="h-5 w-5" />
               Créer un projet
            </Link>
         </div>
      </aside>

      <WidgetHub 
        isOpen={isWidgetHubOpen} 
        onClose={() => setIsWidgetHubOpen(false)} 
        addedWidgets={widgetOrder}
        onToggleWidget={onToggleWidget}
      />
    </div>
  )
}
