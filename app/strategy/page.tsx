"use client"

import { useState } from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { createOKRCheckin } from "@/app/actions"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RAGBadge } from "@/components/rag-badge"
import { UserAvatar } from "@/components/user-avatar"
import {
  getUserById,
  formatNumber,
  type KeyResult,
  type Objective,
  type Pillar,
  type OKRCheckin,
  type Project,
  users,
} from "@/lib/store"
import {
  Target,
  ChevronDown,
  ChevronRight,
  Link2,
  Activity,
  TrendingUp,
  Calendar,
  MessageSquare,
  Globe,
  Network,
  GitMerge,
  ArrowDownWideNarrow,
  PlusCircle,
  FileText
} from "lucide-react"

function KRCard({ kr, checkins }: { kr: KeyResult, checkins: OKRCheckin[] }) {
  const [expanded, setExpanded] = useState(false)
  const owner = users.find(u => u.id === kr.ownerId)
  const krCheckins = checkins.filter(ci => ci.keyResultId === kr.id)
  const progressPercent = kr.type === "metric"
    ? Math.round((kr.current / kr.target) * 100)
    : kr.current

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="rounded-lg border border-border bg-secondary/30 p-3">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-start gap-3 text-left">
            <div className="mt-0.5">
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground font-sans leading-relaxed">
                  {kr.title}
                </p>
                <RAGBadge status={kr.confidence} />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {kr.type === "metric"
                    ? `${formatNumber(kr.current)} / ${formatNumber(kr.target)} ${kr.unit}`
                    : `${kr.current}%`}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {owner && <UserAvatar name={owner.name} fallback={owner.avatar} />}
                <span className="text-xs text-muted-foreground font-sans">{owner?.name}</span>
                <Badge variant="outline" className="text-xs ml-auto font-sans">
                  Poids : {kr.weight}%
                </Badge>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 ml-7 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground font-sans mb-2 flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Check-ins récents
            </p>
            {krCheckins.length > 0 ? (
              <div className="flex flex-col gap-2">
                {krCheckins.slice(0, 3).map((ci) => (
                  <div key={ci.id} className="rounded-md bg-muted/50 p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">{ci.date}</span>
                      <RAGBadge status={ci.confidence} />
                      <span className="text-xs text-success font-mono ml-auto">
                        +{ci.progressDelta}%
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 font-sans leading-relaxed">
                      <MessageSquare className="h-3 w-3 inline mr-1 text-muted-foreground" />
                      {ci.note}
                    </p>
                    {ci.blocker && (
                      <p className="text-xs text-destructive font-sans mt-1">
                        {"Blocage : "}{ci.blocker}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-sans">Aucun check-in pour le moment.</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function ObjectiveCard({ objective, pillars, checkins, projects }: { objective: Objective, pillars: Pillar[], checkins: OKRCheckin[], projects: Project[] }) {
  const [expanded, setExpanded] = useState(true)
  const owner = users.find(u => u.id === objective.ownerId)
  const linkedProjects = projects.filter(p => p.linkedObjectiveIds?.includes(objective.id))
  const pillar = pillars.find((p) => p.id === objective.pillarId)

  return (
    <Card className="bg-card border-border">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-start gap-3 text-left w-full">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-foreground font-sans leading-relaxed">
                    {objective.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <RAGBadge status={objective.confidence} />
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Progress value={objective.progress} className="h-2 flex-1" />
                  <span className="text-sm font-mono text-muted-foreground font-semibold">{objective.progress}%</span>
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {pillar && (
                    <Badge variant="outline" className="text-xs font-sans">
                      {pillar.name}
                    </Badge>
                  )}
                  {owner && (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar name={owner.name} fallback={owner.avatar} />
                      <span className="text-xs text-muted-foreground font-sans">{owner.name}</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground/50 font-sans ml-auto">{objective.period}</span>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Résultats Clés */}
            <div className="flex flex-col gap-3 mb-4">
              <p className="text-xs font-medium text-muted-foreground font-sans uppercase tracking-wider">
                {"Résultats clés"} ({objective.keyResults.length})
              </p>
              {objective.keyResults.map((kr) => (
                <KRCard key={kr.id} kr={kr} checkins={checkins} />
              ))}
            </div>

            {/* Projets liés */}
            {linkedProjects.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground font-sans uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Link2 className="h-3 w-3" /> {"Projets liés"}
                </p>
                <div className="flex flex-col gap-2">
                  {linkedProjects.map((proj) => {
                    const projOwner = users.find(u => u.id === proj.ownerId)
                    return (
                      <div key={proj.id} className="flex items-center gap-3 rounded-md border border-border p-2.5 bg-secondary/20">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground font-sans">{proj.name}</span>
                            <RAGBadge status={proj.status} />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={proj.progress} className="h-1 flex-1 max-w-30" />
                            <span className="text-xs font-mono text-muted-foreground">{proj.progress}%</span>
                            {projOwner && (
                              <span className="text-xs text-muted-foreground font-sans">
                                {projOwner.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function StrategyMap({ pillars, objectives }: { pillars: Pillar[], objectives: Objective[] }) {
  return (
    <div className="space-y-12 py-6">
      {/* Vision Layer */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 rounded-full bg-primary/10 text-primary animate-pulse">
          <Globe className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-bold py-0">Vision</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Devenir le leader mondial du pilotage stratégique</h2>
        </div>
      </div>

      {/* Pillars Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <div className="absolute inset-0 -top-12 flex justify-center -z-10 pointer-events-none">
          <div className="w-px h-12 bg-border border-dashed border-l" />
        </div>
        {pillars.map(pillar => (
          <div key={pillar.id} className="relative group">
            <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="h-10 w-10 rounded-xl bg-background border mx-auto mb-4 flex items-center justify-center text-primary shadow-sm">
                  <Network className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">{pillar.name}</h3>
                <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider font-semibold">Pilier Stratégique</p>
              </CardContent>
            </Card>
            
            {/* Connection Lines to Objectives */}
            <div className="mt-8 space-y-4">
              {objectives.filter(o => o.pillarId === pillar.id).map(obj => (
                <div key={obj.id} className="relative pl-6 border-l-2 border-dashed border-border group-hover:border-primary/30 transition-colors">
                  <div className="absolute top-1/2 left-0 w-4 h-px bg-border border-dashed border-t -translate-y-1/2" />
                  <Card className="bg-card/50 hover:bg-card transition-all cursor-pointer border-white/5 shadow-sm hover:shadow-md">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">OKR</span>
                        <span className="text-xs font-semibold truncate">{obj.title}</span>
                      </div>
                      <Badge className="h-6 w-10 justify-center bg-primary/10 text-primary border-none text-[10px] font-bold">
                        {obj.progress}%
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dependency Legend */}
      <div className="pt-8 border-t flex items-center justify-center gap-8 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-primary" />
          <span>Alignement Vertical (Cascade)</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground" />
          <span>Dépendances inter-équipes</span>
        </div>
      </div>
    </div>
  )
}

export default function StrategyPage() {
  const [isCheckinOpen, setIsCheckinOpen] = useState(false)
  const { objectives, pillars, checkins, projects, loading } = useSupabaseData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCheckin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await createOKRCheckin(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Check-in enregistré !")
        setIsCheckinOpen(false)
      }
    } catch (err) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
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
    <div className="p-6 lg:p-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-sans tracking-tight text-balance">
            Stratégie & OKR
          </h1>
          <p className="text-muted-foreground font-sans mt-1">
            Alignement stratégique, cascade d'objectifs et suivi des résultats clés.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Exporter
          </Button>
          <Dialog open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <PlusCircle className="h-4 w-4" />
                Nouveau Check-in
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-125">
              <DialogHeader>
                <DialogTitle>Effectuer un Check-in Hebdomadaire</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCheckin} className="space-y-6 py-4">
                <div className="space-y-2">
                  <label htmlFor="kr-select" className="text-sm font-medium">Sélectionner un Key Result</label>
                  <select 
                    id="kr-select"
                    name="krId" 
                    className="w-full p-2 rounded-md border bg-background" 
                    required
                    title="Sélectionner un Key Result"
                  >
                    {objectives.flatMap(o => o.keyResults).map(kr => (
                      <option key={kr.id} value={kr.id}>{kr.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="progress-delta" className="text-sm font-medium">Progression (+ Delta)</label>
                  <Input id="progress-delta" name="progressDelta" type="number" step="0.1" placeholder="Ex: 5" required />
                  <p className="text-[10px] text-muted-foreground">Valeur à ajouter à la progression actuelle.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="confidence-select" className="text-sm font-medium">Niveau de confiance</label>
                  <select 
                    id="confidence-select"
                    name="confidence" 
                    className="w-full p-2 rounded-md border bg-background" 
                    defaultValue="on-track"
                    title="Niveau de confiance"
                  >
                    <option value="on-track">Sain (On Track)</option>
                    <option value="at-risk">Risqué (At Risk)</option>
                    <option value="off-track">Critique (Off Track)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes & Commentaires</label>
                  <textarea name="note" className="w-full p-3 rounded-md border bg-background h-24" placeholder="Quels sont les progrès de cette semaine ?" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Blocages (Optionnel)</label>
                  <Input name="blocker" placeholder="Qu'est-ce qui vous ralentit ?" />
                </div>
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le check-in"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="map" className="font-sans">
            <Network className="h-4 w-4 mr-1.5" />
            Strategy Map
          </TabsTrigger>
          <TabsTrigger value="objectives" className="font-sans">
            <Target className="h-4 w-4 mr-1.5" />
            Objectifs
          </TabsTrigger>
          <TabsTrigger value="by-pillar" className="font-sans">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Par pilier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <StrategyMap pillars={pillars} objectives={objectives} />
        </TabsContent>

        <TabsContent value="objectives">
          <div className="flex flex-col gap-6">
            {objectives.map((obj) => (
              <ObjectiveCard key={obj.id} objective={obj} pillars={pillars} checkins={checkins} projects={projects} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-pillar">
          <div className="flex flex-col gap-8">
            {pillars.map((pillar) => {
              const pillarObjectives = objectives.filter(
                (o) => o.pillarId === pillar.id
              )
              return (
                <div key={pillar.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <h2 className="text-lg font-semibold text-foreground font-sans">
                      {pillar.name}
                    </h2>
                    <span className="text-sm text-muted-foreground font-sans">
                      ({pillarObjectives.length} objectif{pillarObjectives.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="flex flex-col gap-4 ml-5 border-l-2 border-border pl-4">
                    {pillarObjectives.map((obj) => (
                      <ObjectiveCard key={obj.id} objective={obj} pillars={pillars} checkins={checkins} projects={projects} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
