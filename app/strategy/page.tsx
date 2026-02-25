"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { RAGBadge } from "@/components/rag-badge"
import { UserAvatar } from "@/components/user-avatar"
import {
  objectives,
  pillars,
  getUserById,
  getProjectsByObjective,
  getCheckinsByKR,
  formatNumber,
  type KeyResult,
  type Objective,
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
} from "lucide-react"

function KRCard({ kr }: { kr: KeyResult }) {
  const [expanded, setExpanded] = useState(false)
  const owner = getUserById(kr.ownerId)
  const checkins = getCheckinsByKR(kr.id)
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
              <Activity className="h-3 w-3" /> Check-ins recents
            </p>
            {checkins.length > 0 ? (
              <div className="flex flex-col gap-2">
                {checkins.slice(0, 3).map((ci) => (
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

function ObjectiveCard({ objective }: { objective: Objective }) {
  const [expanded, setExpanded] = useState(true)
  const owner = getUserById(objective.ownerId)
  const linkedProjects = getProjectsByObjective(objective.id)
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
            {/* Resultats Cles */}
            <div className="flex flex-col gap-3 mb-4">
              <p className="text-xs font-medium text-muted-foreground font-sans uppercase tracking-wider">
                {"Resultats cles"} ({objective.keyResults.length})
              </p>
              {objective.keyResults.map((kr) => (
                <KRCard key={kr.id} kr={kr} />
              ))}
            </div>

            {/* Projets lies */}
            {linkedProjects.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground font-sans uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Link2 className="h-3 w-3" /> {"Projets lies"}
                </p>
                <div className="flex flex-col gap-2">
                  {linkedProjects.map((proj) => {
                    const projOwner = getUserById(proj.ownerId)
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

export default function StrategyPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* En-tete */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground font-sans tracking-tight text-balance">
          {"Strategie"}
        </h1>
        <p className="text-muted-foreground font-sans mt-1">
          {"Arbre OKR avec Resultats cles, check-ins et projets lies"}
        </p>
      </div>

      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="objectives" className="font-sans">
            <Target className="h-4 w-4 mr-1.5" />
            Objectifs
          </TabsTrigger>
          <TabsTrigger value="by-pillar" className="font-sans">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Par pilier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectives">
          <div className="flex flex-col gap-6">
            {objectives.map((obj) => (
              <ObjectiveCard key={obj.id} objective={obj} />
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
                      <ObjectiveCard key={obj.id} objective={obj} />
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
