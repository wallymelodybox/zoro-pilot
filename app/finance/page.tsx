"use client"

import { useState } from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { useUser } from "@/hooks/use-user"
import { formatCurrency } from "@/lib/store"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileText,
  Plus,
  Edit2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function FinancePage() {
  const { projects, tasks, loading } = useSupabaseData()
  const { user } = useUser()
  const [isProjectBudgetDialogOpen, setIsProjectBudgetDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [editingProjectBudget, setEditingProjectBudget] = useState<number | null>(null)
  const supabase = createClient()

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
  const totalTasksBudget = tasks.reduce((sum, t) => sum + (t.budget || 0), 0)

  const handleSaveProjectBudget = async () => {
    if (!selectedProject) return

    const { error } = await supabase
      .from("projects")
      .update({ budget: editingProjectBudget })
      .eq("id", selectedProject.id)

    if (error) {
      toast.error("Erreur lors de la mise à jour du budget")
    } else {
      toast.success("Budget mis à jour !")
      setIsProjectBudgetDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-transparent min-h-screen">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestion Financière</h1>
        <p className="text-muted-foreground">Suivi des budgets alloués aux projets et tâches.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Budget Total Projets</p>
              <div className="text-3xl font-bold">{formatCurrency(totalBudget)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Budget Total Tâches</p>
              <div className="text-3xl font-bold">{formatCurrency(totalTasksBudget)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <PieChart className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Nombre de Projets</p>
              <div className="text-3xl font-bold">{projects.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="border-white/5 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budgets des Projets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Budget Alloué</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(project => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      project.status === 'on-track' ? "bg-emerald-500/10 text-emerald-500 border-none" : 
                      project.status === 'at-risk' ? "bg-amber-500/10 text-amber-500 border-none" : 
                      "bg-rose-500/10 text-rose-500 border-none"
                    }>
                      {project.status === 'on-track' ? 'En bonne voie' : project.status === 'at-risk' ? 'À risque' : 'En retard'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.budget ? formatCurrency(project.budget) : "Non défini"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project)
                        setEditingProjectBudget(project.budget ?? null)
                        setIsProjectBudgetDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    Aucun projet pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tasks Budget Overview */}
      <Card className="border-white/5 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Budgets des Tâches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tâche</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Budget Alloué</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.slice(0, 20).map(task => {
                const project = projects.find(p => p.id === task.projectId)
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{project?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={
                        task.status === 'done' ? "bg-emerald-500/10 text-emerald-500 border-none" : 
                        task.status === 'in-progress' ? "bg-blue-500/10 text-blue-500 border-none" : 
                        task.status === 'blocked' ? "bg-rose-500/10 text-rose-500 border-none" : 
                        "bg-muted text-muted-foreground border-none"
                      }>
                        {task.status === 'todo' ? 'À faire' : 
                         task.status === 'in-progress' ? 'En cours' : 
                         task.status === 'blocked' ? 'Bloqué' : 'Terminé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.budget ? formatCurrency(task.budget) : "Non défini"}
                    </TableCell>
                  </TableRow>
                )
              })}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    Aucune tâche pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Project Budget Dialog */}
      <Dialog open={isProjectBudgetDialogOpen} onOpenChange={setIsProjectBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Budget du Projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du projet</Label>
              <Input value={selectedProject?.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Budget (Fr CFA)</Label>
              <Input 
                type="number" 
                value={editingProjectBudget || ''} 
                onChange={(e) => setEditingProjectBudget(e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsProjectBudgetDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveProjectBudget}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
