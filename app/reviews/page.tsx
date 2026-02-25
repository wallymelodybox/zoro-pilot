"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RAGBadge } from "@/components/rag-badge"
import { UserAvatar } from "@/components/user-avatar"
import {
  objectives,
  projects,
  tasks,
  checkins,
  getUserById,
} from "@/lib/store"
import {
  ClipboardCheck,
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Target,
  Send,
  FileText,
  Activity,
} from "lucide-react"

function WeeklyReviewChecklist() {
  const blockedTasks = tasks.filter((t) => t.status === "blocked")
  const atRiskProjects = projects.filter((p) => p.status !== "on-track")
  const atRiskOKRs = objectives.filter((o) => o.confidence !== "on-track")
  const recentCheckins = checkins.filter((c) => c.date === "2026-02-17")

  return (
    <div className="flex flex-col gap-6">
      {/* Blocages */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-destructive font-sans flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Blocages actifs ({blockedTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {blockedTasks.map((task) => {
                const assignee = getUserById(task.assigneeId)
                const project = projects.find((p) => p.id === task.projectId)
                return (
                  <div key={task.id} className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground font-sans">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground font-sans">{project?.name}</span>
                        {assignee && (
                          <span className="text-xs text-muted-foreground font-sans">
                            — {assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-sans">Aucun blocage cette semaine.</p>
          )}
        </CardContent>
      </Card>

      {/* Elements a risque */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-warning font-sans flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {"Elements a discuter"} ({atRiskProjects.length + atRiskOKRs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {atRiskOKRs.map((okr) => (
              <div key={okr.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-sans">{okr.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={okr.progress} className="h-1 w-20" />
                    <span className="text-xs font-mono text-muted-foreground">{okr.progress}%</span>
                  </div>
                </div>
                <RAGBadge status={okr.confidence} />
              </div>
            ))}
            {atRiskProjects.map((proj) => (
              <div key={proj.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-sans">{proj.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={proj.progress} className="h-1 w-20" />
                    <span className="text-xs font-mono text-muted-foreground">{proj.progress}%</span>
                  </div>
                </div>
                <RAGBadge status={proj.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resume check-ins */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground font-sans flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Check-ins de la semaine ({recentCheckins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {recentCheckins.map((ci) => {
              const kr = objectives
                .flatMap((o) => o.keyResults)
                .find((k) => k.id === ci.keyResultId)
              return (
                <div key={ci.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground font-sans">
                        {kr?.title ?? "RC inconnu"}
                      </span>
                      <RAGBadge status={ci.confidence} />
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">{ci.note}</p>
                  </div>
                  <span className="text-xs font-mono text-success shrink-0">+{ci.progressDelta}%</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function OKRCheckinForm() {
  const [selectedKR, setSelectedKR] = useState<string>("")
  const [confidence, setConfidence] = useState<string>("")
  const [note, setNote] = useState("")
  const [blocker, setBlocker] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const allKRs = objectives.flatMap((o) =>
    o.keyResults.map((kr) => ({
      ...kr,
      objectiveTitle: o.title,
    }))
  )

  const handleSubmit = () => {
    if (selectedKR && confidence && note) {
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setSelectedKR("")
        setConfidence("")
        setNote("")
        setBlocker("")
      }, 2000)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground font-sans flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Check-in OKR hebdomadaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="text-sm font-medium text-foreground font-sans">{"Check-in soumis avec succes !"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Selection RC */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground font-sans">{"Resultat cle"}</label>
              <Select value={selectedKR} onValueChange={setSelectedKR}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un Resultat cle..." />
                </SelectTrigger>
                <SelectContent>
                  {allKRs.map((kr) => (
                    <SelectItem key={kr.id} value={kr.id}>
                      <span className="text-sm font-sans">{kr.title}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Confiance */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground font-sans">Niveau de confiance</label>
              <Select value={confidence} onValueChange={setConfidence}>
                <SelectTrigger>
                  <SelectValue placeholder="Quel est votre niveau de confiance ?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-track">En bonne voie</SelectItem>
                  <SelectItem value="at-risk">A risque</SelectItem>
                  <SelectItem value="off-track">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground font-sans">Notes de progression</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Que s'est-il passe cette semaine ? Avancees cles, progres..."
                className="min-h-20 font-sans text-sm"
              />
            </div>

            {/* Blocage */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground font-sans">Blocages (optionnel)</label>
              <Textarea
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                placeholder="Y a-t-il des blocages empechant la progression ?"
                className="min-h-15 font-sans text-sm"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedKR || !confidence || !note}
              className="w-full font-sans"
            >
              <Send className="h-4 w-4 mr-2" />
              Soumettre le check-in
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DecisionLog() {
  const decisions = [
    {
      id: "d1",
      date: "2026-02-17",
      author: "Sarah Chen",
      summary: "Prioriser le lancement MENA sur LATAM pour T1",
      impact: "Reporte l'expansion LATAM au T2 mais securise l'objectif de revenus MENA",
      linkedProject: "Lancement Region MENA",
    },
    {
      id: "d2",
      date: "2026-02-10",
      author: "Amina Youssef",
      summary: "Basculer de REST vers GraphQL pour API v2",
      impact: "Ajoute 2 semaines au planning mais reduit le cout de maintenance long terme",
      linkedProject: "Refonte API v2",
    },
    {
      id: "d3",
      date: "2026-02-03",
      author: "Marc Dubois",
      summary: "Recruter 2 ingenieurs supplementaires pour l'equipe performance",
      impact: "Augmentation budget de 40K EUR/mois, devrait debloquer l'objectif latence p95",
      linkedProject: "Sprint Optimisation Performance",
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground font-sans flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Journal des decisions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {decisions.map((decision) => (
            <div key={decision.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">{decision.date}</span>
                <span className="text-xs text-muted-foreground font-sans">par {decision.author}</span>
              </div>
              <p className="text-sm font-medium text-foreground font-sans mb-1">{decision.summary}</p>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-2">
                Impact : {decision.impact}
              </p>
              <Badge variant="outline" className="text-xs font-sans">
                {decision.linkedProject}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReviewsPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* En-tete */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground font-sans tracking-tight text-balance">
          Revues
        </h1>
        <p className="text-muted-foreground font-sans mt-1">
          {"Check-ins hebdomadaires, listes de revue et journal des decisions"}
        </p>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="weekly" className="font-sans">
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Revue hebdomadaire
          </TabsTrigger>
          <TabsTrigger value="checkin" className="font-sans">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Check-in OKR
          </TabsTrigger>
          <TabsTrigger value="decisions" className="font-sans">
            <FileText className="h-4 w-4 mr-1.5" />
            {"Decisions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <WeeklyReviewChecklist />
        </TabsContent>

        <TabsContent value="checkin">
          <div className="max-w-lg">
            <OKRCheckinForm />
          </div>
        </TabsContent>

        <TabsContent value="decisions">
          <div className="max-w-2xl">
            <DecisionLog />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
