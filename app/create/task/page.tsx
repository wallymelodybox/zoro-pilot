"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createTask } from "@/app/actions"
import { toast } from "sonner"
import { useSupabaseData } from "@/hooks/use-supabase"
import { useUser } from "@/hooks/use-user"
import { isOrgAdminOrSuperAdmin } from "@/lib/roles"
import {
  FolderKanban,
  Calendar,
  User,
  Tag,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function CreateTaskPage() {
  const router = useRouter()
  const { user } = useUser()
  const { projects, profiles } = useSupabaseData()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Default to first project if available, or empty
  const [projectId, setProjectId] = useState("")
  const [priority, setPriority] = useState("medium")
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [visibility, setVisibility] = useState("private")
  const [progress, setProgress] = useState(0)
  const canAssignTasks = isOrgAdminOrSuperAdmin(user?.rbac_role)
  const selectedAssigneeIds = canAssignTasks ? (assigneeIds.length > 0 ? assigneeIds : [user?.id || ""]) : [user?.id || ""]

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title) return
    
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await createTask(formData)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.success) {
        toast.success("Tâche créée avec succès !")
        router.push('/work')
      }
    } catch (e) {
      console.error(e)
      toast.error("Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background/50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-card rounded-xl shadow-lg border overflow-hidden flex flex-col h-150 animate-in fade-in zoom-in-95 duration-200">
        
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <Link href="/create" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
              Annuler
            </Link>
            <span className="font-semibold text-sm">Créer une tâche</span>
            <Button 
              type="submit"
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary/80 hover:bg-primary/5 font-medium"
              disabled={!title || loading}
            >
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-auto bg-background">
             <div className="p-4 space-y-4">
                {/* Title Input */}
                <Input
                  name="title"
                  placeholder="Titre"
                  className="text-lg font-medium border-muted-foreground/20 h-12 px-3 bg-background focus-visible:ring-0 focus-visible:border-primary/50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />

                {/* Description Textarea */}
                <Textarea
                  name="description"
                  placeholder="Description"
                  className="min-h-50 resize-none border-muted-foreground/20 p-3 bg-background focus-visible:ring-0 focus-visible:border-primary/50"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
             </div>

             <div className="mt-auto border-t divide-y">
                {/* Project Selector */}
                <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group relative">
                   <div className="flex items-center gap-3 text-sm text-foreground">
                      <FolderKanban className="h-4 w-4 text-blue-500" />
                      <span>Projet</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-40 justify-end">
                      <Select name="projectId" value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger className="w-45 h-8 border-none bg-transparent shadow-none focus:ring-0 text-right justify-end px-0">
                          <SelectValue placeholder="Sélectionner un projet" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                          {projects.length === 0 && <SelectItem value="none" disabled>Aucun projet</SelectItem>}
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                {/* Date Selector */}
                <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group">
                   <div className="flex items-center gap-3 text-sm text-foreground">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>Date d'échéance</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Input 
                        type="date" 
                        name="dueDate" 
                        className="h-8 w-auto border-none bg-transparent shadow-none focus-visible:ring-0 text-right px-0"
                      />
                   </div>
                </div>

                {/* Priority Selector */}
                <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group">
                   <div className="flex items-center gap-3 text-sm text-foreground">
                      <Tag className="h-4 w-4 text-blue-500" />
                      <span>Priorité</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-40 justify-end">
                      <Select name="priority" value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-35 h-8 border-none bg-transparent shadow-none focus:ring-0 text-right justify-end px-0">
                          <SelectValue placeholder="Priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                {canAssignTasks && (
                  <>
                    <div className="w-full px-4 py-3 hover:bg-muted/50 transition-colors group">
                      <div className="mb-2 flex items-center gap-3 text-sm text-foreground">
                        <User className="h-4 w-4 text-blue-500" />
                        <span>Assignée à</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {profiles.map((profile: any) => {
                          const checked = selectedAssigneeIds.includes(profile.id)
                          return (
                            <label key={profile.id} className="flex items-center justify-between rounded-md border px-2 py-2 text-sm">
                              <span className="truncate">{profile.name}</span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  setAssigneeIds((current) =>
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

                    <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3 text-sm text-foreground">
                        <User className="h-4 w-4 text-blue-500" />
                        <span>Visibilité</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-40 justify-end">
                        <Select name="visibility" value={visibility} onValueChange={setVisibility}>
                          <SelectTrigger className="w-45 h-8 border-none bg-transparent shadow-none focus:ring-0 text-right justify-end px-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Privée</SelectItem>
                            <SelectItem value="organization">Toute l'organisation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group">
                   <div className="flex items-center gap-3 text-sm text-foreground">
                      <Tag className="h-4 w-4 text-blue-500" />
                      <span>Progression</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-44 justify-end">
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        name="progress"
                        value={progress}
                        onChange={(event) => setProgress(Number(event.target.value))}
                        className="h-8 w-32 border-none bg-transparent shadow-none"
                      />
                      <span className="w-10 text-right font-mono">{progress}%</span>
                   </div>
                </div>
                
                {/* Hidden Inputs for Select values to work with FormData */}
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="priority" value={priority} />
                <input type="hidden" name="visibility" value={canAssignTasks ? visibility : "private"} />
                {selectedAssigneeIds.filter(Boolean).map((id) => (
                  <input key={id} type="hidden" name="assigneeIds" value={id} />
                ))}

                {/* Hidden Inputs for defaults */}
                <input type="hidden" name="status" value="todo" />
                <input type="hidden" name="assigneeId" value={selectedAssigneeIds[0] || user?.id || ""} />

             </div>
          </div>
        </form>
      </div>
    </div>
  )
}
