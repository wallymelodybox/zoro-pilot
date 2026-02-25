"use client"

import * as React from "react"
import { 
  X, 
  Search, 
  LayoutGrid, 
  PieChart, 
  ListTodo, 
  Calendar, 
  Wrench,
  CheckCircle2,
  Users,
  Tag,
  Clock,
  Plus,
  StickyNote,
  ExternalLink,
  Type
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WidgetHubProps {
  isOpen: boolean
  onClose: () => void
}

const categories = [
  { id: "all", label: "Tout", icon: LayoutGrid },
  { id: "charts", label: "Diagrammes", icon: PieChart },
  { id: "lists", label: "Listes", icon: ListTodo },
  { id: "calendar", label: "Calendrier", icon: Calendar },
  { id: "utils", label: "Utilitaires", icon: Wrench },
]

const widgets = [
  {
    category: "charts",
    title: "Diagramme personnalisé",
    description: "Créez sans effort des diagrammes dynamiques pour suivre l'avancement des projets, des ressources et des tâches.",
    icon: PieChart,
    color: "bg-blue-500",
  },
  {
    category: "charts",
    title: "État d'avancement des tâches par projet",
    description: "Une répartition claire de l'état d'avancement des tâches dans tous vos projets. Identifiez facilement les progrès.",
    icon: CheckCircle2,
    color: "bg-emerald-500",
  },
  {
    category: "charts",
    title: "Tâches par état d'avancement",
    description: "Obtenez une vue segmentée des tâches en fonction de leur état d'avancement (due, en retard, à venir).",
    icon: Clock,
    color: "bg-rose-500",
  },
  {
    category: "charts",
    title: "État d'avancement par responsable",
    description: "Bénéficiez d'une vue d'ensemble de l'avancement des tâches assignées à chacun pour une gestion efficace.",
    icon: Users,
    color: "bg-indigo-500",
  },
  {
    category: "charts",
    title: "Utilisation des étiquettes",
    description: "Suivez la fréquence des étiquettes de tâches afin de vous aider à catégoriser et à hiérarchiser les tâches.",
    icon: Tag,
    color: "bg-amber-500",
  },
  {
    category: "lists",
    title: "Projets",
    description: "Profitez d'un affichage rapide et complet de tous vos projets en un même endroit.",
    icon: ListTodo,
    color: "bg-sky-500",
  },
  {
    category: "lists",
    title: "Liste de tâches",
    description: "Gérez efficacement vos tâches avec notre affichage Liste classique et intuitif.",
    icon: Plus,
    color: "bg-violet-500",
  },
  {
    category: "calendar",
    title: "Jour",
    description: "Suivez la progression de vos tâches grâce à la vue journalière du calendrier.",
    icon: Calendar,
    color: "bg-orange-500",
  },
  {
    category: "calendar",
    title: "Vue d'ensemble du mois",
    description: "Le calendrier mensuel permet de visualiser l'état d'avancement des tâches et la planification.",
    icon: Calendar,
    color: "bg-pink-500",
  },
  {
    category: "utils",
    title: "Pense-bêtes",
    description: "Retenez et organisez vos idées sans effort à l'aide des pense-bêtes. Idéal pour la prise de notes rapide.",
    icon: StickyNote,
    color: "bg-yellow-400",
  },
  {
    category: "utils",
    title: "Actions",
    description: "La création facile de boutons reliés à des URL ou des formulaires pour améliorer l'interactivité.",
    icon: ExternalLink,
    color: "bg-blue-600",
  },
  {
    category: "utils",
    title: "RTF",
    description: "Utilisez le format RTF pour des informations et une documentation approfondies avec mise en forme.",
    icon: Type,
    color: "bg-slate-700",
  }
]

export function WidgetHub({ isOpen, onClose }: WidgetHubProps) {
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredWidgets = widgets.filter(widget => {
    const matchesCategory = activeCategory === "all" || widget.category === activeCategory
    const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          widget.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen p-0 gap-0 border-none bg-[#121212] overflow-hidden rounded-none shadow-2xl">
        <div className="flex h-full">
          {/* Sidebar */}
          <aside className="w-64 bg-[#1a1a1a] border-r border-white/5 flex flex-col shrink-0">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white tracking-tight">Widgets</h2>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Recherche" 
                  className="pl-9 h-9 bg-black/20 border-white/5 focus-visible:ring-primary/50 rounded-lg text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <nav className="flex-1 px-3 space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                    activeCategory === cat.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <cat.icon className={cn("h-4 w-4 shrink-0", activeCategory === cat.id ? "text-white" : "text-muted-foreground group-hover:text-white")} />
                  {cat.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-[#121212]">
            <header className="h-16 border-b border-white/5 flex items-center justify-end px-6 shrink-0">
              <button 
                onClick={onClose}
                className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
              >
                Fait
              </button>
            </header>

            <ScrollArea className="flex-1">
              <div className="max-w-350 mx-auto p-12 space-y-16">
                {/* Categorized Sections or All Grid */}
                {activeCategory === "all" ? (
                  <div className="space-y-16">
                    {["charts", "lists", "calendar", "utils"].map(catId => {
                      const catWidgets = filteredWidgets.filter(w => w.category === catId)
                      if (catWidgets.length === 0) return null
                      
                      const catName = categories.find(c => c.id === catId)?.label
                      
                      return (
                        <section key={catId} className="space-y-8">
                          <h3 className="text-2xl font-bold text-white tracking-tight">{catName}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {catWidgets.map((widget, idx) => (
                              <WidgetCard key={idx} widget={widget} />
                            ))}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredWidgets.map((widget, idx) => (
                      <WidgetCard key={idx} widget={widget} />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function WidgetCard({ widget }: { widget: any }) {
  return (
    <div className="group bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 hover:bg-[#222222] hover:border-white/10 transition-all cursor-pointer flex flex-col gap-4 text-center items-center">
      <div className={cn("h-32 w-full rounded-xl flex items-center justify-center relative overflow-hidden bg-black/40")}>
         {/* Visual representation based on widget type */}
         <div className="opacity-80">
            <widget.icon className="h-12 w-12 text-white/20" />
         </div>
         
         {/* Abstract background shapes */}
         <div className={cn("absolute inset-0 opacity-10", widget.color)} />
      </div>
      
      <div className="space-y-2">
        <h4 className="font-bold text-sm text-white leading-tight group-hover:text-blue-400 transition-colors">{widget.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {widget.description}
        </p>
      </div>
    </div>
  )
}
