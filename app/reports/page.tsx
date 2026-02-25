"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RAGBadge } from "@/components/rag-badge"
import { UserAvatar } from "@/components/user-avatar"
import {
  objectives,
  projects,
  tasks,
  users,
  getUserById,
  getTasksByProject,
} from "@/lib/store"
import {
  BarChart3,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
} from "recharts"

export default function ReportsPage() {
  const teamWorkload = users.map((u) => {
    const userTasks = tasks.filter((t) => t.assigneeId === u.id)
    const done = userTasks.filter((t) => t.status === "done").length
    const active = userTasks.filter((t) => t.status === "in-progress").length
    const blocked = userTasks.filter((t) => t.status === "blocked").length
    return {
      name: u.name.split(" ")[0],
      total: userTasks.length,
      done,
      active,
      blocked,
    }
  })

  const trendData = [
    { week: "S1", okrProgress: 20, tasksDone: 3 },
    { week: "S2", okrProgress: 32, tasksDone: 5 },
    { week: "S3", okrProgress: 41, tasksDone: 4 },
    { week: "S4", okrProgress: 48, tasksDone: 7 },
    { week: "S5", okrProgress: 55, tasksDone: 6 },
    { week: "S6", okrProgress: 62, tasksDone: 7 },
    { week: "S7", okrProgress: 63, tasksDone: 5 },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* En-tete */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground font-sans tracking-tight text-balance">
          Rapports
        </h1>
        <p className="text-muted-foreground font-sans mt-1">
          {"Analyses, tendances et vue d'ensemble des performances"}
        </p>
      </div>

      {/* Stats resume */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-sans">Progression OKR moy.</span>
            </div>
            <span className="text-2xl font-bold text-foreground font-sans">
              {Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)}%
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground font-sans">{"Taches terminees"}</span>
            </div>
            <span className="text-2xl font-bold text-foreground font-sans">
              {tasks.filter((t) => t.status === "done").length}/{tasks.length}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground font-sans">{"Elements bloques"}</span>
            </div>
            <span className="text-2xl font-bold text-foreground font-sans">
              {tasks.filter((t) => t.status === "blocked").length}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground font-sans">Progression projets moy.</span>
            </div>
            <span className="text-2xl font-bold text-foreground font-sans">
              {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Tendance progression */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-sans flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendance hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 260)" />
                  <XAxis dataKey="week" tick={{ fill: "oklch(0.6 0.01 260)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.6 0.01 260)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "oklch(0.17 0.005 260)",
                      border: "1px solid oklch(0.25 0.01 260)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="okrProgress" stroke="oklch(0.65 0.2 250)" strokeWidth={2} name="Progression OKR %" dot={false} />
                  <Line type="monotone" dataKey="tasksDone" stroke="oklch(0.7 0.18 165)" strokeWidth={2} name="Taches terminees" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Charge equipe */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-sans flex items-center gap-2">
              <Users className="h-4 w-4" />
              {"Charge de l'equipe"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 260)" />
                  <XAxis dataKey="name" tick={{ fill: "oklch(0.6 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.6 0.01 260)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "oklch(0.17 0.005 260)",
                      border: "1px solid oklch(0.25 0.01 260)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="done" stackId="a" fill="oklch(0.7 0.18 165)" radius={[0, 0, 0, 0]} name="Termine" />
                  <Bar dataKey="active" stackId="a" fill="oklch(0.65 0.2 250)" radius={[0, 0, 0, 0]} name="En cours" />
                  <Bar dataKey="blocked" stackId="a" fill="oklch(0.55 0.22 27)" radius={[4, 4, 0, 0]} name="Bloque" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau livraison projets */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground font-sans flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d{"'"}ensemble livraison projets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_120px_100px] gap-2 px-4 py-2 bg-secondary/50 text-xs font-medium text-muted-foreground font-sans">
              <span>Projet</span>
              <span>Progression</span>
              <span>{"Completion taches"}</span>
              <span>Statut</span>
            </div>
            {projects.map((proj) => {
              const pTasks = getTasksByProject(proj.id)
              const done = pTasks.filter((t) => t.status === "done").length
              const total = pTasks.length
              const owner = getUserById(proj.ownerId)
              const taskCompletion = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div key={proj.id} className="grid grid-cols-[1fr_120px_120px_100px] gap-2 px-4 py-3 border-t border-border items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground font-sans">{proj.name}</p>
                    {owner && (
                      <span className="text-xs text-muted-foreground font-sans">{owner.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={proj.progress} className="h-1.5 flex-1" />
                    <span className="text-xs font-mono text-muted-foreground">{proj.progress}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={taskCompletion} className="h-1.5 flex-1" />
                    <span className="text-xs font-mono text-muted-foreground">{done}/{total}</span>
                  </div>
                  <RAGBadge status={proj.status} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
