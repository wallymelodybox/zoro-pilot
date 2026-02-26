"use client"

import {
  CheckSquare,
  FolderKanban,
  ListTodo,
  Database,
  Folder,
  FileText,
  MessageSquare,
  Briefcase,
  Layout,
  CalendarDays,
  Sun,
  Search,
  X
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

const items = [
  {
    title: "Tâche",
    description: "Créez une nouvelle tâche et ajoutez-la à un projet ou à une liste de tâches.",
    icon: CheckSquare,
    color: "text-blue-500 bg-blue-50",
    href: "/create/task"
  },
  {
    title: "Projet",
    description: "Planifiez des projets complexes avec sous-tâches, dépendances et ressources.",
    icon: FolderKanban,
    color: "text-purple-500 bg-purple-50",
    href: "/create/project"
  },
  {
    title: "Liste",
    description: "Une liste simple de tâches avec étapes, dates d'échéance et assignations.",
    icon: ListTodo,
    color: "text-pink-500 bg-pink-50",
    href: "/create/list"
  },
  {
    title: "Base de données",
    description: "Stockez des données structurées comme des clients ou des inventaires.",
    icon: Database,
    color: "text-emerald-500 bg-emerald-50",
    href: "/create/database"
  },
  {
    title: "Dossier",
    description: "Organisez vos projets, listes et fichiers dans des dossiers.",
    icon: Folder,
    color: "text-yellow-500 bg-yellow-50",
    href: "/create/folder"
  },
  {
    title: "Document",
    description: "Créez et partagez des documents collaboratifs avec votre équipe.",
    icon: FileText,
    color: "text-orange-500 bg-orange-50",
    href: "/create/doc"
  },
  {
    title: "Chat",
    description: "Démarrez une nouvelle conversation ou créez un groupe de discussion.",
    icon: MessageSquare,
    color: "text-indigo-500 bg-indigo-50",
    href: "/create/chat"
  },
  {
    title: "Portefeuille",
    description: "Regroupez plusieurs projets pour une vue d'ensemble stratégique.",
    icon: Briefcase,
    color: "text-amber-700 bg-amber-50",
    href: "/create/portfolio"
  },
  {
    title: "Tableau de bord",
    description: "Visualisez vos données clés avec des graphiques et des widgets personnalisés.",
    icon: Layout,
    color: "text-cyan-500 bg-cyan-50",
    href: "/create/dashboard"
  },
  {
    title: "Calendrier",
    description: "Planifiez des événements et visualisez vos échéances dans un calendrier.",
    icon: CalendarDays,
    color: "text-red-500 bg-red-50",
    href: "/create/calendar"
  },
  {
    title: "Ma journée",
    description: "Organisez votre journée de travail et définissez vos priorités quotidiennes.",
    icon: Sun,
    color: "text-yellow-600 bg-yellow-100",
    href: "/create/my-day"
  }
]

export default function CreateHubPage() {
  return (
    <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-card/80 backdrop-blur-xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-transparent shrink-0">
          <h1 className="text-lg font-semibold text-foreground">Créer</h1>
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Fermer">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-muted/30 backdrop-blur-md shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9 bg-card/50" 
              placeholder="Rechercher un type d'élément..." 
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {items.map((item, idx) => (
              <Link 
                key={idx} 
                href={item.href}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/80 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm font-medium text-foreground mb-0.5 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
