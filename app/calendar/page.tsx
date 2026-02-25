"use client"

import * as React from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  startOfDay,
  isToday,
  subWeeks,
  addWeeks,
  parseISO
} from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { getPriorityColor } from "@/lib/store"

type ViewType = "month" | "week" | "day"

export default function CalendarPage() {
  const { tasks, projects, loading } = useSupabaseData()
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [view, setView] = React.useState<ViewType>("month")

  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const today = () => setCurrentDate(new Date())

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Chargement du calendrier...</div>
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b shrink-0">
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
               <Button 
                 variant={view === "month" ? "secondary" : "ghost"} 
                 size="sm" 
                 className={cn("h-7 px-3", view === "month" && "bg-background shadow-sm")}
                 onClick={() => setView("month")}
               >
                 Mois
               </Button>
               <Button 
                 variant={view === "week" ? "secondary" : "ghost"} 
                 size="sm" 
                 className={cn("h-7 px-3", view === "week" && "bg-background shadow-sm")}
                 onClick={() => setView("week")}
               >
                 Semaine
               </Button>
               <Button 
                 variant={view === "day" ? "secondary" : "ghost"} 
                 size="sm" 
                 className={cn("h-7 px-3", view === "day" && "bg-background shadow-sm")}
                 onClick={() => setView("day")}
               >
                 Jour
               </Button>
            </div>
            <div className="flex items-center gap-1 ml-4">
               <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}>
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               <Button variant="outline" size="sm" className="h-8 px-3" onClick={today}>
                  Aujourd'hui
               </Button>
               <span className="text-sm font-semibold w-40 text-center capitalize">
                  {format(currentDate, view === "day" ? "d MMMM yyyy" : "MMMM yyyy", { locale: fr })}
               </span>
               <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}>
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
         <div className="h-full bg-background rounded-xl border shadow-sm flex flex-col overflow-hidden">
            {view === "month" && <MonthView currentDate={currentDate} tasks={tasks} projects={projects} />}
            {view === "week" && <WeekView currentDate={currentDate} tasks={tasks} projects={projects} />}
            {view === "day" && <DayView currentDate={currentDate} tasks={tasks} projects={projects} />}
         </div>
      </main>
    </div>
  )
}

function MonthView({ currentDate, tasks, projects }: { currentDate: Date, tasks: any[], projects: any[] }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <>
      <div className="grid grid-cols-7 border-b bg-muted/5 shrink-0">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="p-3 text-xs font-bold text-center text-muted-foreground border-r last:border-r-0 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
        {days.map((day, i) => {
          const dayTasks = tasks.filter(task => task.dueDate && isSameDay(parseISO(task.dueDate), day))
          return (
            <div key={i} className={cn(
              "border-b border-r p-2 min-h-30 relative group transition-colors",
              !isSameMonth(day, monthStart) && "bg-muted/5 opacity-40",
              isToday(day) && "bg-primary/5"
            )}>
              <span className={cn(
                "text-xs font-bold p-1 w-6 h-6 flex items-center justify-center rounded-full mb-1",
                isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </span>
              
              <div className="space-y-1 overflow-y-auto max-h-20 scrollbar-hide">
                {dayTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId)
                  return (
                    <div key={task.id} className={cn(
                      "text-[10px] p-1 rounded border truncate cursor-pointer hover:brightness-95 transition-all shadow-sm",
                      task.status === 'done' ? "bg-muted text-muted-foreground line-through border-transparent" : "bg-card border-border border-l-2",
                      !task.status.includes('done') && (
                        task.priority === 'urgent' ? "border-l-destructive" :
                        task.priority === 'high' ? "border-l-orange-500" :
                        "border-l-blue-500"
                      )
                    )}>
                      <span className="font-semibold mr-1">[{project?.name?.substring(0, 3)}]</span>
                      {task.title}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function WeekView({ currentDate, tasks, projects }: { currentDate: Date, tasks: any[], projects: any[] }) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[80px_1fr] border-b bg-muted/5 shrink-0">
        <div className="p-3 border-r" />
        <div className="grid grid-cols-7">
          {days.map(day => (
            <div key={day.toString()} className={cn(
              "p-3 text-center border-r last:border-r-0 flex flex-col items-center gap-1",
              isToday(day) && "bg-primary/5"
            )}>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{format(day, "EEE", { locale: fr })}</span>
              <span className={cn(
                "text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full",
                isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>{format(day, "d")}</span>
            </div>
          ))}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[80px_1fr]">
          <div className="border-r bg-muted/5">
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b p-2 text-[10px] font-medium text-muted-foreground text-right">
                {hour}:00
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 relative">
            {days.map(day => (
              <div key={day.toString()} className="border-r last:border-r-0 relative">
                {hours.map(hour => (
                  <div key={hour} className="h-20 border-b" />
                ))}
                
                {/* Events for this day */}
                <div className="absolute inset-0 p-1 pointer-events-none">
                  {tasks
                    .filter(task => task.dueDate && isSameDay(parseISO(task.dueDate), day))
                    .map((task, idx) => (
                      <div key={task.id} className={cn(
                        "p-2 rounded border mb-1 pointer-events-auto cursor-pointer shadow-sm text-xs",
                        task.status === 'done' ? "bg-muted/50 opacity-60" : "bg-card"
                      )}>
                        <div className="font-bold truncate">{task.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.priority}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function DayView({ currentDate, tasks, projects }: { currentDate: Date, tasks: any[], projects: any[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const dayTasks = tasks.filter(task => task.dueDate && isSameDay(parseISO(task.dueDate), currentDate))

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-6 border-b flex items-center justify-between bg-muted/5">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{format(currentDate, "EEEE d MMMM", { locale: fr })}</span>
          <span className="text-muted-foreground">{dayTasks.length} tâches prévues</span>
        </div>
        <Badge variant="outline" className="h-6 px-3">
          {isToday(currentDate) ? "Aujourd'hui" : format(currentDate, "yyyy")}
        </Badge>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="flex h-full">
          <div className="w-24 border-r bg-muted/5">
            {hours.map(hour => (
              <div key={hour} className="h-24 border-b p-4 text-xs font-bold text-muted-foreground text-right">
                {hour}:00
              </div>
            ))}
          </div>
          <div className="flex-1 relative p-6">
            <div className="space-y-4">
              {dayTasks.length > 0 ? dayTasks.map(task => {
                const project = projects.find(p => p.id === task.projectId)
                return (
                  <div key={task.id} className="flex items-start gap-4 p-4 rounded-2xl border bg-background hover:shadow-md transition-all group">
                    <div className={cn("w-1.5 h-12 rounded-full", 
                      task.priority === 'urgent' ? "bg-destructive" :
                      task.priority === 'high' ? "bg-orange-500" :
                      "bg-blue-500"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg">{task.title}</span>
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">{task.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary/40" />
                          {project?.name || "Sans projet"}
                        </span>
                        <span>•</span>
                        <span>{task.status}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )
              }) : (
                <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-40">
                  <CalendarDays className="h-16 w-16 mb-4" />
                  <p className="text-lg font-medium">Aucune tâche pour cette journée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function subDays(date: Date, amount: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - amount)
  return d
}
