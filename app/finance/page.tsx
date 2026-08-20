"use client"

import { useState } from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { useUser } from "@/hooks/use-user"
import { formatCurrency, getTaskStatusLabel, getTaskStatusColor } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileText,
  Plus,
  Edit2,
  Download,
  ReceiptText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FinancePage() {
  const { projects, tasks, subBudgets, financialTransactions, loading, refresh } = useSupabaseData()
  const { user } = useUser()
  const [isProjectBudgetDialogOpen, setIsProjectBudgetDialogOpen] = useState(false)
  const [isSubBudgetDialogOpen, setIsSubBudgetDialogOpen] = useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [editingProjectBudget, setEditingProjectBudget] = useState<number | null>(null)
  const [subBudgetForm, setSubBudgetForm] = useState({ name: "", amount: 0, description: "" })
  const [transactionForm, setTransactionForm] = useState({ 
    title: "", 
    amount: 0, 
    type: "expense" as "expense" | "income", 
    description: "", 
    category: "", 
    date: new Date().toISOString().split('T')[0] 
  })
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
      refresh()
    }
  }

  const handleAddSubBudget = async () => {
    if (!selectedProject || !subBudgetForm.name || subBudgetForm.amount <= 0) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const { error } = await supabase
      .from("sub_budgets")
      .insert({
        name: subBudgetForm.name,
        project_id: selectedProject.id,
        amount: subBudgetForm.amount,
        description: subBudgetForm.description
      })

    if (error) {
      toast.error("Erreur lors de l'ajout du sous-budget")
    } else {
      toast.success("Sous-budget ajouté avec succès !")
      setIsSubBudgetDialogOpen(false)
      setSubBudgetForm({ name: "", amount: 0, description: "" })
      refresh()
    }
  }

  const handleAddTransaction = async () => {
    if (!transactionForm.title || transactionForm.amount <= 0) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const { error } = await supabase
      .from("financial_transactions")
      .insert({
        title: transactionForm.title,
        amount: transactionForm.amount,
        type: transactionForm.type,
        description: transactionForm.description,
        category: transactionForm.category,
        date: transactionForm.date,
        project_id: selectedProject?.id || null
      })

    if (error) {
      toast.error("Erreur lors de l'ajout de la transaction")
    } else {
      toast.success("Transaction ajoutée avec succès !")
      setIsTransactionDialogOpen(false)
      setTransactionForm({ 
        title: "", 
        amount: 0, 
        type: "expense", 
        description: "", 
        category: "", 
        date: new Date().toISOString().split('T')[0] 
      })
      refresh()
    }
  }

  const handleExportPDF = () => {
    window.print()
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Financière</h1>
          <p className="text-muted-foreground">Suivi des budgets, sous-budgets et transactions financières.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleExportPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter en PDF
          </Button>
        </div>
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

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="projects">Projets & Budgets</TabsTrigger>
          <TabsTrigger value="subbudgets">Sous-budgets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6 space-y-6">
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
                          <Badge variant="secondary" className={cn(getTaskStatusColor(task.status), "border-none")}>
                            {getTaskStatusLabel(task.status)}
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
        </TabsContent>

        <TabsContent value="subbudgets" className="mt-6">
          <Card className="border-white/5 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sous-budgets
              </CardTitle>
              <Button onClick={() => setIsSubBudgetDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un sous-budget
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Ajoutez des sous-budgets pour décomposer les budgets de projets.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subBudgets.map(sb => {
                    const project = projects.find(p => p.id === sb.projectId)
                    return (
                      <TableRow key={sb.id}>
                        <TableCell className="font-medium">{sb.name}</TableCell>
                        <TableCell>{project?.name || "—"}</TableCell>
                        <TableCell>{formatCurrency(sb.amount)}</TableCell>
                        <TableCell>{sb.description || "—"}</TableCell>
                      </TableRow>
                    )
                  })}
                  {subBudgets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                        Aucun sous-budget pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card className="border-white/5 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ReceiptText className="h-5 w-5" />
                Transactions Financières
              </CardTitle>
              <Button onClick={() => setIsTransactionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une transaction
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Suivez toutes les dépenses et revenus financiers.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Projet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialTransactions.map(ft => {
                    const project = projects.find(p => p.id === ft.projectId)
                    return (
                      <TableRow key={ft.id}>
                        <TableCell className="font-medium">{ft.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            ft.type === 'expense' ? "bg-rose-500/10 text-rose-500 border-none" : 
                            "bg-emerald-500/10 text-emerald-500 border-none"
                          }>
                            {ft.type === 'expense' ? 'Dépense' : 'Revenu'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ft.type === 'expense' ? `-${formatCurrency(ft.amount)}` : `+${formatCurrency(ft.amount)}`}
                        </TableCell>
                        <TableCell>{new Date(ft.date).toLocaleDateString()}</TableCell>
                        <TableCell>{ft.category || "—"}</TableCell>
                        <TableCell>{project?.name || "—"}</TableCell>
                      </TableRow>
                    )
                  })}
                  {financialTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        Aucune transaction pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Add Sub Budget Dialog */}
      <Dialog open={isSubBudgetDialogOpen} onOpenChange={setIsSubBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Sous-budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Projet</Label>
              <Select 
                onValueChange={(val) => {
                  const project = projects.find(p => p.id === val)
                  setSelectedProject(project)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom du sous-budget</Label>
              <Input 
                value={subBudgetForm.name}
                onChange={(e) => setSubBudgetForm({...subBudgetForm, name: e.target.value})}
                placeholder="Ex : Matériel, Salaires, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Montant (Fr CFA)</Label>
              <Input 
                type="number"
                value={subBudgetForm.amount || ''}
                onChange={(e) => setSubBudgetForm({...subBudgetForm, amount: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Input 
                value={subBudgetForm.description}
                onChange={(e) => setSubBudgetForm({...subBudgetForm, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsSubBudgetDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddSubBudget}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input 
                value={transactionForm.title}
                onChange={(e) => setTransactionForm({...transactionForm, title: e.target.value})}
                placeholder="Ex : Achat de matériel"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={transactionForm.type}
                  onValueChange={(val: "expense" | "income") => setTransactionForm({...transactionForm, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Dépense</SelectItem>
                    <SelectItem value="income">Revenu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant (Fr CFA)</Label>
                <Input 
                  type="number"
                  value={transactionForm.amount || ''}
                  onChange={(e) => setTransactionForm({...transactionForm, amount: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie (optionnel)</Label>
                <Input 
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({...transactionForm, category: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Input 
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Projet (optionnel)</Label>
              <Select 
                onValueChange={(val) => {
                  const project = projects.find(p => p.id === val)
                  setSelectedProject(project)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsTransactionDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddTransaction}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSS pour impression PDF */}
      <style>{`
        @media print {
          button,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>
    </div>
  )
}
