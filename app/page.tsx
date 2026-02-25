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
import { WidgetHub } from "@/components/widget-hub"
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
        "relative group cursor-default", 
        isDragging ? "z-50 opacity-80" : "z-auto opacity-100",
        className
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20 p-2 bg-muted/50 rounded-lg"
        title="Faire glisser pour réorganiser"
      >
        <div className="grid grid-cols-2 gap-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const { projects, loading } = useSupabaseData()
  const [isWidgetHubOpen, setIsWidgetHubOpen] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [widgetOrder, setWidgetOrder] = React.useState([
    'projects-widget',
    'status-widgets',
    'progress-widget',
    'calendar-widget'
  ])

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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
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
        case 'status-widgets':
          return (
            <div className="space-y-6 h-full">
              <div className="grid grid-cols-2 gap-4">
                {/* Ma journée */}
                <div className="bg-card/50 border rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-center h-44">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ma journée</h3>
                  <div className="h-20 w-20 rounded-full border-4 border-blue-500/30 flex items-center justify-center relative">
                     <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent -rotate-45" />
                     <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
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
        case 'progress-widget':
          return (
            <div className="bg-card/50 border rounded-3xl p-6 h-80 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold">Progression Globale des Objectifs</h2>
                </div>
                <Badge variant="outline" className="bg-orange-500/5 text-orange-500 border-orange-500/20">
                  T1 2026
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Croissance</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Excellence Produit</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Équipe & Culture</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    3 Objectifs sains
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                    1 Objectif à risque
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
          return null
      }
    }

    if (isOverlay) {
      return (
        <div className={cn(
          id === 'projects-widget' ? "col-span-5" : 
          id === 'status-widgets' ? "col-span-4" : 
          id === 'progress-widget' ? "col-span-12" : 
          "col-span-3"
        )}>
          {content()}
        </div>
      )
    }

    return (
      <DraggableWidget 
        key={id} 
        id={id} 
        className={cn(
          id === 'projects-widget' ? "col-span-12 lg:col-span-5" : 
          id === 'status-widgets' ? "col-span-12 lg:col-span-4" : 
          id === 'progress-widget' ? "col-span-12 lg:col-span-12" : 
          "col-span-12 lg:col-span-3"
        )}
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
          <div className="flex flex-col items-center text-center space-y-4">
            <span className="text-sm font-medium text-muted-foreground/80 lowercase">{dateStr}</span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Bonjour, Menann Zoro !</h1>
            
            {/* Action Pills */}
            <div className="flex items-center gap-3 pt-2">
               <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border hover:bg-muted transition-colors text-sm font-medium">
                  <UserAvatar name="Menann Zoro" fallback="MZ" className="h-5 w-5" />
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
               <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border hover:bg-muted transition-colors text-sm font-medium">
                  <LayoutDashboard className="h-4 w-4" />
                  Basculer vers l'affichage classique
               </button>
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

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.4',
                  },
                },
              }),
            }}>
              {activeId ? (
                <div className="w-full h-full opacity-90 scale-105 transition-transform pointer-events-none">
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

         <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 opacity-40">
            <div className="h-32 w-32 relative">
               <div className="absolute inset-0 flex flex-col gap-2 p-4">
                  <div className="h-2 w-full bg-blue-500 rounded-full" />
                  <div className="h-2 w-2/3 bg-muted rounded-full" />
                  <div className="h-2 w-1/2 bg-muted rounded-full" />
               </div>
               <div className="absolute inset-0 border-2 border-dashed rounded-2xl" />
            </div>
            <p className="text-sm font-medium">Pas de tâches</p>
         </div>

         <div className="p-6 mt-auto space-y-4">
            <Button className="w-full h-12 rounded-2xl bg-muted/20 hover:bg-muted/40 text-foreground border border-muted-foreground/10 justify-start gap-3 px-4 transition-all hover:scale-[1.02]" variant="ghost">
               <PlusCircle className="h-5 w-5 text-blue-500" />
               Créer une tâche
            </Button>
            
            <button className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-3 font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20">
               <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                 <UserAvatar name="Menann Zoro" fallback="MZ" className="h-5 w-5" />
               </div>
               Chats
            </button>
         </div>
      </aside>

      <WidgetHub isOpen={isWidgetHubOpen} onClose={() => setIsWidgetHubOpen(false)} />
    </div>
  )
}
