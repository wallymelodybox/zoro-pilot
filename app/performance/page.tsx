"use client"

import * as React from "react"
import { useSupabaseData } from "@/hooks/use-supabase"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/store"
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Activity,
  Layers,
  Briefcase,
  PieChart as PieChartIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function PerformancePage() {
  const { projects, objectives, keyResults, loading } = useSupabaseData()

  // Build chart data dynamically from keyResults progression
  const chartData = React.useMemo(() => {
    if (keyResults.length === 0) return []
    // Group KRs by category and show current vs target as a trend
    // Use up to 6 KRs as data points for the chart
    return keyResults.slice(0, 6).map(kr => ({
      name: kr.title.length > 18 ? kr.title.slice(0, 18) + "…" : kr.title,
      current: kr.current,
      target: kr.target,
    }))
  }, [keyResults])

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
        <h1 className="text-3xl font-bold tracking-tight">Performance & KPI</h1>
        <p className="text-muted-foreground">Suivi consolidé de la performance opérationnelle et stratégique.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {keyResults.map(kr => {
          const trend: "up" | "down" | "stable" = kr.confidence === 'on-track' ? "up" : kr.confidence === 'at-risk' ? "stable" : "down"
          return (
            <Card key={kr.id} className="overflow-hidden border-white/5 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className={
                    trend === 'up' ? "text-success border-success/20 bg-success/5" : 
                    trend === 'down' ? "text-destructive border-destructive/20 bg-destructive/5" : ""
                  }>
                    {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                     trend === 'down' ? <ArrowDownRight className="h-3 w-3 mr-1" /> : 
                     <Minus className="h-3 w-3 mr-1" />}
                    {trend === 'up' ? '+5.2%' : trend === 'down' ? '-2.1%' : 'Stable'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{kr.title}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold">{formatNumber(kr.current)}{kr.unit}</h3>
                    <span className="text-sm text-muted-foreground">/ {formatNumber(kr.target)}{kr.unit}</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Progression cible</span>
                    <span>{Math.round((kr.current / kr.target) * 100)}%</span>
                  </div>
                  <Progress value={(kr.current / kr.target) * 100} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
        {keyResults.length === 0 && (
          <div className="md:col-span-3 text-center py-10 border border-dashed rounded-xl">
            <p className="text-muted-foreground">Aucun Key Result (KPI) défini pour cette organisation.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KPI Progress Chart */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Progression des KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <Tooltip
                      contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                      itemStyle={{fontSize: '12px'}}
                    />
                    <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} name="Valeur actuelle" />
                    <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} name="Cible" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                Aucun KPI défini. Créez des Key Results pour voir la progression.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio View */}
        <Card className="border-white/5 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
              Vue Portefeuille Projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {projects.slice(0, 5).map(project => (
                <div key={project.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        project.status === 'on-track' ? "bg-success" : 
                        project.status === 'at-risk' ? "bg-warning" : "bg-destructive"
                      )} />
                      <span className="text-sm font-semibold">{project.name}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun projet en cours.</p>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground hover:text-foreground">
              Voir tous les projets
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Strategic OKR Scorecard */}
      <Card className="border-white/5 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-rose-500" />
            Scorecard Stratégique (OKR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            {objectives.map(obj => (
              <div key={obj.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center font-bold text-sm">
                    {obj.progress}%
                  </div>
                  <Badge variant="secondary" className={
                    obj.confidence === 'on-track' ? "bg-success/10 text-success border-none" : 
                    obj.confidence === 'at-risk' ? "bg-warning/10 text-warning border-none" : 
                    "bg-destructive/10 text-destructive border-none"
                  }>
                    {obj.confidence === 'on-track' ? 'Sain' : obj.confidence === 'at-risk' ? 'Risqué' : 'Critique'}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold leading-tight line-clamp-2">{obj.title}</h4>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  <Layers className="h-3 w-3" />
                  {obj.keyResults.length} Key Results
                </div>
              </div>
            ))}
            {objectives.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">Aucun objectif défini.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
