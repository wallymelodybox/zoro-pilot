"use client"

import * as React from "react"
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Users,
  Target,
  ChevronRight,
  Maximize2,
  X,
  PieChart,
  BarChart3,
  Calendar,
  Zap,
  DollarSign,
  Gavel,
  ArrowRight,
  MessageSquare,
  Pin,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface WeeklySummaryProps {
  role: "admin" | "executive" | "member" | "manager"
  userName: string
}

export function WeeklySummary({ role, userName }: WeeklySummaryProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const isDG = role === "admin" || role === "executive"
  const today = new Date("2026-03-02") // Fixed date for demo: Monday

  const history = [
    { date: "23/02/2026", progress: "65%", status: "On Track" },
    { date: "16/02/2026", progress: "62%", status: "At Risk" },
    { date: "09/02/2026", progress: "58%", status: "On Track" },
    { date: "02/02/2026", progress: "54%", status: "On Track" },
  ]

  const handleExportPDF = () => {
    setIsExporting(true)
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Génération du PDF en cours...',
        success: () => {
          setIsExporting(false)
          return 'Le résumé a été exporté avec succès !'
        },
        error: 'Erreur lors de l\'exportation',
      }
    )
  }

  // Mock Data for DG
  const dgStats = {
    progress: 68,
    tasksDone: 42,
    tasksPlanned: 55,
    okrTrack: 85,
    risks: [
      { id: 1, title: "Retard déploiement MENA", impact: "high", prob: "medium", owner: "Fatima B.", date: "15/03" },
      { id: 2, title: "Dépassement budget Cloud", impact: "medium", prob: "high", owner: "Amina Y.", date: "10/03" },
    ],
    projects: { onTrack: 12, atRisk: 4, offTrack: 2 },
    burnRate: "85%",
    forecast: "Dans les clous",
    decisions: [
      { title: "Recrutement dev senior", type: "Ressources", priority: "high" },
      { title: "Pivot marketing Q2", type: "Stratégie", priority: "medium" },
    ]
  }

  // Mock Data for Employee
  const employeeStats = {
    tasks: { done: 8, doing: 3, late: 1 },
    priorities: [
      "Finaliser l'intégration Stripe",
      "Correction bug auth SSO",
      "Documentation API v2",
      "Réunion équipe Lundi 10h",
      "Revue de code Amina",
    ],
    blockers: [
      { title: "Accès sandbox Stripe", owner: "Amina Y." }
    ],
    mentions: 4
  }

  return (
    <>
      {/* Animated Border Card */}
      <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className="absolute -inset-0.5 bg-linear-to-r from-primary via-purple-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <Card className="relative bg-card/90 backdrop-blur-xl border-border/40 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <Zap className="h-4 w-4 fill-primary/20" />
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-70">Résumé Hebdomadaire</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] bg-background/50 border-primary/20 text-primary">
                Généré le 02/03/2026 00:00
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Bonjour {userName.split(" ")[0]} 👋</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isDG ? "Voici l'état de santé de votre organisation." : "Prêt pour une nouvelle semaine productive ?"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{isDG ? dgStats.progress : employeeStats.tasks.done}%</span>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground/60">{isDG ? "Avancement Global" : "Tâches Finies"}</p>
                </div>
              </div>

              {/* Quick Preview Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Priorité</span>
                  </div>
                  <p className="text-xs font-medium truncate">
                    {isDG ? dgStats.decisions[0].title : employeeStats.priorities[0]}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{isDG ? "Risques" : "Blocages"}</span>
                  </div>
                  <p className="text-xs font-medium truncate">
                    {isDG ? `${dgStats.risks.length} alertes critiques` : `${employeeStats.blockers.length} blocage actif`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                Voir les détails actionnables <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary via-purple-500 to-blue-500" />
          
          <DialogHeader className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <Zap className="h-8 w-8 text-primary fill-primary/20" />
                  RÉSUMÉ HEBDOMADAIRE
                </DialogTitle>
                <DialogDescription className="text-base font-medium text-muted-foreground mt-1">
                  Période du 23/02 au 01/03/2026 • {isDG ? "Vue Exécutive" : "Vue Opérationnelle"}
                </DialogDescription>
              </div>
              <div className="text-right hidden sm:block">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs py-1 px-3">
                  Version 1.4.0
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-8 py-4">
              {showHistory ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold">Historique des Snapshots</h4>
                    <Button variant="ghost" onClick={() => setShowHistory(false)} className="gap-2">
                      <ArrowRight className="h-4 w-4 rotate-180" /> Retour au résumé actuel
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {history.map((h, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-between group hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center border border-border/40 shadow-sm group-hover:border-primary/20 transition-colors">
                            <Calendar className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div>
                            <p className="text-lg font-bold">{h.date}</p>
                            <p className="text-sm text-muted-foreground uppercase font-bold tracking-tighter">Snapshot hebdomadaire</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="text-right">
                            <p className="text-xl font-black text-primary">{h.progress}</p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Avancement</p>
                          </div>
                          <Badge className={cn(
                            "px-3 py-1",
                            h.status === "On Track" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {h.status}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isDG ? (
                // DG VIEW CONTENT
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Column 1: Performance & Health */}
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Performance & OKR
                      </h4>
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/20 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Avancement Stratégique</span>
                            <span>{dgStats.progress}%</span>
                          </div>
                          <Progress value={dgStats.progress} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-background/50 rounded-xl border border-border/20">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Tâches finies</span>
                            <p className="text-xl font-black">{dgStats.tasksDone}/{dgStats.tasksPlanned}</p>
                          </div>
                          <div className="p-3 bg-background/50 rounded-xl border border-border/20">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Confiance OKR</span>
                            <p className="text-xl font-black text-green-500">HAUTE</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Risques & Alertes (Priorité)
                      </h4>
                      <div className="space-y-3">
                        {dgStats.risks.map(risk => (
                          <div key={risk.id} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-bold">{risk.title}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Proprio: {risk.owner} • Échéance: {risk.date}</p>
                            </div>
                            <Badge className={cn(
                              "text-[10px] uppercase",
                              risk.impact === "high" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {risk.impact} impact
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Column 2: Resources & Decisions */}
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Santé du Portefeuille
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                          <p className="text-2xl font-black text-green-500">{dgStats.projects.onTrack}</p>
                          <p className="text-[8px] uppercase font-bold">On Track</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                          <p className="text-2xl font-black text-amber-500">{dgStats.projects.atRisk}</p>
                          <p className="text-[8px] uppercase font-bold">At Risk</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                          <p className="text-2xl font-black text-red-500">{dgStats.projects.offTrack}</p>
                          <p className="text-[8px] uppercase font-bold">Off Track</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
                        <Gavel className="h-4 w-4" /> Décisions & Arbitrages
                      </h4>
                      <div className="space-y-3">
                        {dgStats.decisions.map((dec, i) => (
                          <div key={i} className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                              <p className="text-sm font-bold">{dec.title}</p>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{dec.type}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Finance & Budget</h4>
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-black">2.4M FCFA</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Consommé / Prévisionnel</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 text-[10px]">+5% vs budget</Badge>
                      </div>
                    </section>
                  </div>
                </div>
              ) : (
                // EMPLOYEE VIEW CONTENT
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Column 1: Bilan & Priorities */}
                   <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Bilan Semaine Passée
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                          <p className="text-2xl font-black text-green-500">{employeeStats.tasks.done}</p>
                          <p className="text-[8px] uppercase font-bold">Faites</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                          <p className="text-2xl font-black text-blue-500">{employeeStats.tasks.doing}</p>
                          <p className="text-[8px] uppercase font-bold">En cours</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                          <p className="text-2xl font-black text-red-500">{employeeStats.tasks.late}</p>
                          <p className="text-[8px] uppercase font-bold">Retard</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                        <Pin className="h-4 w-4" /> Top 5 Priorités Lundi
                      </h4>
                      <div className="space-y-2">
                        {employeeStats.priorities.map((p, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20 group hover:bg-primary/5 transition-colors">
                            <span className="text-xs font-black text-muted-foreground group-hover:text-primary">{i+1}.</span>
                            <span className="text-sm font-medium">{p}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Column 2: Blockers & Interactions */}
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Blocages & Dépendances
                      </h4>
                      <div className="space-y-3">
                        {employeeStats.blockers.map((b, i) => (
                          <div key={i} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-bold">{b.title}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">Bloqué par: {b.owner}</p>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold">Relancer</Button>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Notifications & Mentions
                      </h4>
                      <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                              <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center border-2 border-background">
                              {employeeStats.mentions}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold">Mentions directes</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Requérant votre attention</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </section>

                    <section className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3">Ma Contribution OKR</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-bold italic">"Amélioration NPS Client"</p>
                          <Progress value={45} className="h-1.5" />
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-primary">45%</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-border/40 bg-muted/20 flex items-center justify-between">
            <Button 
              variant="ghost" 
              className={cn("text-xs font-bold uppercase tracking-widest gap-2", showHistory && "text-primary bg-primary/5")}
              onClick={() => setShowHistory(!showHistory)}
            >
              <Calendar className="h-4 w-4" /> {showHistory ? "Masquer l'historique" : "Voir historiques"}
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl px-6">Fermer</Button>
              <Button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="rounded-xl px-6 shadow-lg shadow-primary/20 gap-2"
              >
                {isExporting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Exporter PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
