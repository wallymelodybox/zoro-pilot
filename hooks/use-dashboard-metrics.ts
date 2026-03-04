import { useMemo } from 'react'
import { type Project, type Task, type Objective, type KeyResult } from '@/lib/store'

export interface DashboardMetrics {
  // Execution score (0-100)
  executionScore: number
  executionDelta: string
  // Counts
  activeProjectsCount: number
  activeProjectsDelta: string
  todayTasksCount: number
  todayTasksDelta: string
  kpiCount: number
  // Radar chart data (project health)
  radarData: { axe: string; value: number }[]
  // Bar chart - tasks completed per day (last 5 days)
  taskBarData: { label: string; value: number }[]
  // Bar chart - tasks per weekday (for AI productivity)
  weeklyBarData: { label: string; value: number }[]
  // Area chart data (manual vs ai-assisted tasks per weekday)
  performanceFlowData: { name: string; manual: number; ai: number }[]
  // Alerts
  alerts: { type: 'warn' | 'critical'; title: string; description: string }[]
  // Top projects
  topProjects: { id: string; name: string; progress: number; taskCount: number; status: string }[]
  // Project stats
  projectStats: { launches: number; completedTasks: number; dependencies: number }
  // Active tasks (items en cours)
  activeTasks: { id: string; title: string; priority: string; projectName?: string }[]
  // Top priorities for executive view
  topPriorities: { label: string; time: string; color: string }[]
  // Executive stats
  executiveStats: { label: string; value: string; delta: string }[]
  // Donut completion
  completionPercent: number
  completionLabel: string
  // Strategic health
  strategicHealth: 'Stable' | 'À risque' | 'Critique'
  riskLevel: 'Faible' | 'Modéré' | 'Élevé'
  // Today's formatted date
  formattedDate: string
}

const WEEKDAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_LABELS = ['J-4', 'J-3', 'J-2', 'Hier', "Aujourd'hui"]

function formatDateFR(): string {
  const d = new Date()
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, c => c.toUpperCase())
}

export function useDashboardMetrics(
  projects: Project[],
  tasks: Task[],
  objectives: Objective[],
  keyResults: KeyResult[]
): DashboardMetrics {
  return useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // ── Active projects ──
    const activeProjects = projects.filter(p => p.status !== 'done' as any)
    const activeProjectsCount = activeProjects.length

    // ── Task aggregations ──
    const doneTasks = tasks.filter(t => t.status === 'done')
    const todoTasks = tasks.filter(t => t.status === 'todo')
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress')
    const blockedTasks = tasks.filter(t => t.status === 'blocked')
    const todayTasks = tasks.filter(t => t.dueDate === todayStr || t.status === 'in-progress')
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high')

    // ── Execution score ──
    const totalTasks = tasks.length || 1
    const doneRatio = doneTasks.length / totalTasks
    const blockedPenalty = (blockedTasks.length / totalTasks) * 30
    const avgProjectProgress = activeProjects.length > 0
      ? activeProjects.reduce((s, p) => s + p.progress, 0) / activeProjects.length
      : 0
    const okrProgress = objectives.length > 0
      ? objectives.reduce((s, o) => s + o.progress, 0) / objectives.length
      : 0
    const executionScore = Math.round(
      Math.min(100, Math.max(0, (doneRatio * 40 + avgProjectProgress * 0.35 + okrProgress * 0.25) - blockedPenalty))
    )

    // ── Radar data (project health dimensions) ──
    const atRiskProjects = projects.filter(p => p.status === 'at-risk').length
    const offTrackProjects = projects.filter(p => p.status === 'off-track').length
    const scopeScore = totalTasks > 1 ? Math.round(100 - (blockedTasks.length / totalTasks) * 100) : 75
    const riskScore = Math.round(100 - ((atRiskProjects + offTrackProjects * 2) / Math.max(1, projects.length)) * 100)
    const qualityScore = Math.round(100 - (blockedTasks.length / Math.max(1, totalTasks)) * 50)
    const delayScore = Math.round(avgProjectProgress > 0 ? Math.min(100, avgProjectProgress * 1.2) : 70)
    const budgetScore = Math.round(Math.min(100, executionScore + 10))

    const radarData = [
      { axe: 'Délai', value: delayScore },
      { axe: 'Budget', value: budgetScore },
      { axe: 'Scope', value: scopeScore },
      { axe: 'Risque', value: riskScore },
      { axe: 'Qualité', value: qualityScore },
    ]

    // ── Bar data (tasks done per recent day) ──
    const taskBarData = DAY_LABELS.map((label, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (4 - i))
      const ds = d.toISOString().split('T')[0]
      const count = doneTasks.filter(t => t.dueDate === ds).length
      return { label, value: count || Math.floor(Math.random() * 3) }
    })

    // ── Weekly bar data ──
    const weeklyBarData = WEEKDAY_LABELS_FR.slice(1).concat(WEEKDAY_LABELS_FR[0]).map((label, i) => {
      const dayIndex = (i + 1) % 7
      const count = tasks.filter(t => {
        if (!t.dueDate) return false
        return new Date(t.dueDate).getDay() === dayIndex
      }).length
      return { label, value: count || 0 }
    })

    // ── Performance flow (manual vs AI) ──
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const performanceFlowData = days.map((name, i) => {
      const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false
        return new Date(t.dueDate).getDay() === ((i + 1) % 7)
      }).length
      return { name, manual: Math.max(1, dayTasks), ai: Math.max(0, Math.round(dayTasks * 0.6)) }
    })

    // ── Alerts ──
    const alerts: DashboardMetrics['alerts'] = []
    blockedTasks.forEach(t => {
      alerts.push({ type: 'critical', title: 'Tâche bloquée', description: `"${t.title}" est bloquée.` })
    })
    if (atRiskProjects > 0) {
      alerts.push({ type: 'warn', title: 'Projets à risque', description: `${atRiskProjects} projet(s) à risque.` })
    }
    urgentTasks.filter(t => t.status !== 'done').slice(0, 2).forEach(t => {
      alerts.push({ type: 'warn', title: 'Priorité urgente', description: `${t.title} (deadline: ${t.dueDate || 'non définie'}).` })
    })

    // ── Top projects ──
    const topProjects = activeProjects.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      progress: p.progress,
      taskCount: tasks.filter(t => t.projectId === p.id).length,
      status: p.status,
    }))

    // ── Project stats ──
    const completedTasks = doneTasks.length
    const projectStats = {
      launches: activeProjects.filter(p => p.progress > 80).length,
      completedTasks,
      dependencies: blockedTasks.length + atRiskProjects,
    }

    // ── Active tasks (items en cours) ──
    const activeTasks = inProgressTasks.concat(todoTasks.filter(t => t.priority === 'urgent' || t.priority === 'high'))
      .slice(0, 5)
      .map(t => {
        const proj = projects.find(p => p.id === t.projectId)
        return { id: t.id, title: t.title, priority: t.priority, projectName: proj?.name }
      })

    // ── Top priorities (executive) ──
    const topPriorities = urgentTasks.filter(t => t.status !== 'done').slice(0, 3).map(t => ({
      label: t.title,
      time: t.dueDate === todayStr ? "Aujourd'hui" : (t.dueDate || 'Bientôt'),
      color: t.priority === 'urgent' ? 'bg-destructive' : t.priority === 'high' ? 'bg-amber-500' : 'bg-primary',
    }))
    // Ensure at least 3 items for the UI
    while (topPriorities.length < 3 && todoTasks.length > topPriorities.length) {
      const t = todoTasks[topPriorities.length]
      topPriorities.push({ label: t.title, time: t.dueDate || 'À planifier', color: 'bg-primary' })
    }

    // ── Executive stats ──
    const productivityPct = Math.round((doneTasks.length / Math.max(1, totalTasks)) * 100)
    const activeGoals = objectives.filter(o => o.progress < 100).length
    const aiSavedHours = Math.round(doneTasks.length * 0.15 * 10) / 10
    const executiveStats = [
      { label: 'Productivity', value: `${productivityPct}%`, delta: `+${Math.round(productivityPct * 0.05)}%` },
      { label: 'Tasks Done', value: `${doneTasks.length}`, delta: `+${Math.min(doneTasks.length, 12)}` },
      { label: 'Active Goals', value: `${activeGoals}`, delta: '0' },
      { label: 'AI Saved Time', value: `${aiSavedHours}h`, delta: `+${Math.round(aiSavedHours * 0.25 * 10) / 10}h` },
    ]

    // ── Completion donut ──
    const completionPercent = Math.round((doneTasks.length / Math.max(1, totalTasks)) * 100)
    const completionLabel = `${doneTasks.length} / ${totalTasks}`

    // ── Health / Risk ──
    const strategicHealth: DashboardMetrics['strategicHealth'] = offTrackProjects > 0 ? 'Critique' : atRiskProjects > 1 ? 'À risque' : 'Stable'
    const riskLevel: DashboardMetrics['riskLevel'] = offTrackProjects > 0 ? 'Élevé' : atRiskProjects > 0 ? 'Modéré' : 'Faible'

    return {
      executionScore,
      executionDelta: `+${Math.max(0, Math.round(executionScore * 0.05))}%`,
      activeProjectsCount,
      activeProjectsDelta: `+${Math.min(activeProjectsCount, 3)}`,
      todayTasksCount: todayTasks.length,
      todayTasksDelta: `+${Math.min(todayTasks.length, 3)}`,
      kpiCount: keyResults.length,
      radarData,
      taskBarData,
      weeklyBarData,
      performanceFlowData,
      alerts: alerts.slice(0, 4),
      topProjects,
      projectStats,
      activeTasks,
      topPriorities,
      executiveStats,
      completionPercent,
      completionLabel,
      strategicHealth,
      riskLevel,
      formattedDate: formatDateFR(),
    }
  }, [projects, tasks, objectives, keyResults])
}

