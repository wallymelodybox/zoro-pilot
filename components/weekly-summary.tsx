"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Target, 
  Download,
  FileText,
  TrendingUp,
  Calendar,
  Building2,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { getWeeklySummaryData } from "@/app/actions"

interface WeeklyReportProps {
  userId?: string
}

export function WeeklySummary({ userId }: WeeklyReportProps) {
  const { user: currentUser } = useUser()
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const targetUserId = userId || currentUser?.id

  React.useEffect(() => {
    if (targetUserId) {
      loadData()
    }
  }, [targetUserId])

  async function loadData() {
    setLoading(true)
    try {
      const res = await getWeeklySummaryData(targetUserId!)
      setData(res)
    } catch (err) {
      console.error("Error loading weekly summary:", err)
      toast.error("Erreur de chargement du rapport")
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Génération du PDF en cours...',
        success: 'Rapport hebdomadaire exporté avec succès !',
        error: 'Erreur lors de l\'exportation.',
      }
    )
    // Simulated PDF download
    console.log("Exporting PDF for", data?.profile?.name)
  }

  if (loading) {
    return (
      <Card className="w-full border-dashed border-2 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Préparation du rapport hebdomadaire...</p>
      </Card>
    )
  }

  if (!data || !data.profile) {
    return (
      <Card className="w-full border-dashed border-2 p-8 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm font-medium">Aucune donnée disponible pour ce rapport.</p>
      </Card>
    )
  }

  const isDG = currentUser?.rbac_role === 'admin' || currentUser?.rbac_role === 'executive'

  return (
    <div className="space-y-6">
      {/* Header with Dynamic Gradient Border */}
      <div className="relative overflow-hidden rounded-3xl p-0.5 group">
        <div className="absolute inset-0 bg-linear-to-r via-blue-500 to-purple-600 group-hover:duration-200 from-primary animate-tilt" />
        <div className="relative flex flex-col items-center justify-between gap-6 rounded-[22px] p-6 backdrop-blur-xl md:flex-row md:p-8 bg-card/95">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner bg-primary/10 text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-sans text-2xl font-black tracking-tight">Résumé de la Semaine</h2>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Badge variant="outline" className="rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase bg-muted/50 border-border-/50">
                  <Calendar className="mr-1 h-3 w-3 text-primary" />
                  Semaine du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </Badge>
                <Badge variant="outline" className="rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase bg-muted/50 border-border-/50">
                  <Clock className="mr-1 h-3 w-3 text-blue-500" />
                  {new Date().toLocaleDateString('fr-FR', { year: 'numeric' })}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl font-sans text-sm font-semibold transition-all border-border-/40 hover:bg-muted/50" onClick={() => setHistoryOpen(!historyOpen)}>
              <Clock className="mr-2 h-4 w-4" />
              Historique
            </Button>
            <Button className="rounded-xl font-sans text-sm font-bold shadow-lg transition-all active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exporter en PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Insights (DG View or Employee View) */}
        <div className="space-y-6 md:col-span-2">
          <Card className="overflow-hidden rounded-3xl backdrop-blur-sm border-border-/40 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="h-5 w-5 text-green-500" />
                {isDG ? "KPIs & Performance Globale" : "Mes Réalisations Clés"}
              </CardTitle>
              <CardDescription>
                {isDG ? "Vision stratégique de l'organisation pour cette semaine." : "Ce que j'ai accompli au cours des 7 derniers jours."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isDG ? (
                // DG VIEW: Strategy & High Level
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.objectives.map((obj: any) => (
                    <div key={obj.id} className="space-y-3 rounded-2xl border p-4 bg-muted/20 border-border-/30">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm leading-tight font-bold">{obj.title}</span>
                        <Badge variant={obj.progress > 80 ? 'default' : 'secondary'}>{obj.progress}%</Badge>
                      </div>
                      <Progress value={obj.progress} className="h-1.5" />
                      <div className="flex flex-col gap-1">
                        {obj.key_results?.slice(0, 2).map((kr: any) => (
                          <div key={kr.id} className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="max-w-30 truncate">{kr.title}</span>
                            <span className="font-mono">{Math.round((kr.current_value / kr.target_value) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // EMPLOYEE VIEW: Tasks & Productivity
                <div className="space-y-4">
                  {data.recentTasks.length > 0 ? (
                    <div className="space-y-3">
                      {data.recentTasks.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="flex items-center gap-3 rounded-xl border p-3 transition-colors bg-muted/20 border-border-/30 group hover:bg-muted/40">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium">{task.title}</p>
                            <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{task.projects?.name || 'Sans Projet'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      Aucune tâche terminée cette semaine.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blockers & Priorities */}
          <Card className="rounded-3xl backdrop-blur-sm border-border-/40 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {isDG ? "Risques & Points de Vigilance" : "Bloquages & Prochaines Étapes"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.pendingTasks.filter((t: any) => t.status === 'blocked').length > 0 ? (
                  data.pendingTasks.filter((t: any) => t.status === 'blocked').map((t: any) => (
                    <div key={t.id} className="flex items-start gap-3 rounded-xl border p-3 bg-destructive/10 border-destructive/20">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                      <div>
                        <p className="text-sm font-bold text-destructive">{t.title}</p>
                        <p className="mt-1 text-xs text-destructive/80">{t.description || "Besoin d'assistance ou d'approbation pour avancer."}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-600">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">Aucun point bloquant critique identifié.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="rounded-3xl p-6 backdrop-blur-sm border-border-/40 bg-card/40">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="h-20 w-20 rounded-full border-4 p-1 border-primary/20">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full text-2xl font-black bg-muted text-primary">
                  {data.profile.avatar_url ? <img src={data.profile.avatar_url} alt={data.profile.name} className="h-full w-full object-cover" /> : data.profile.name.charAt(0)}
                </div>
              </div>
              <div>
                <h3 className="font-sans text-lg font-black">{data.profile.name}</h3>
                <p className="text-xs font-medium text-muted-foreground">{data.profile.role}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary">
                <Users className="h-3 w-3" />
                {data.profile.teams?.name || 'Zoro Pilot'}
              </div>
            </div>
            
            <Separator className="my-6 opacity-50" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-muted-foreground">Tâches Finies</span>
                <span className="text-sm font-bold">{data.recentTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-muted-foreground">En cours</span>
                <span className="text-sm font-bold">{data.pendingTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-muted-foreground">Projets Actifs</span>
                <span className="text-sm font-bold">{data.activeProjects.length}</span>
              </div>
            </div>
          </Card>

          <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl p-6 text-center shadow-xl bg-primary shadow-primary/20">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                <Target className="h-6 w-6" />
             </div>
             <div className="text-white">
                <p className="text-xs font-bold tracking-widest uppercase opacity-80">Objectif du mois</p>
                <p className="mt-1 text-lg leading-tight font-black">Lancement Zoro V2</p>
             </div>
             <Progress value={65} className="h-1.5 w-full bg-white/20" />
             <p className="text-[10px] font-bold text-white/90">65% de progression globale</p>
          </div>
        </div>
      </div>
    </div>
  )
}
