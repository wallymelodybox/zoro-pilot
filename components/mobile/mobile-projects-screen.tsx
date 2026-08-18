"use client"

import Link from "next/link"
import React from "react"
import { Search, SlidersHorizontal, Plus, FolderKanban, ClipboardCheck, TrendingUp, ClipboardList, CalendarDays, Layers } from "lucide-react"
import { MobileHeader } from "./mobile-header"
import { MobileStatCard, MobileStatusPill } from "./mobile-stat-card"
import { mobileTheme } from "./mobile-theme"
import type { Project, Task } from "@/lib/store"

type Filter = "all" | "active" | "late" | "done"

const statusLabel = (status: Project["status"], progress: number) => {
  if (progress >= 100) return { label: "Terminé", tone: "good" as const }
  if (status === "off-track") return { label: "En retard", tone: "warn" as const }
  return { label: "En cours", tone: "good" as const }
}

function formatRange(start?: string, end?: string) {
  if (!start && !end) return "Dates non définies"
  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  return fmt(start || end!)
}

function ProjectRow({ project, taskCount, indent = false }: { project: Project; taskCount: number; indent?: boolean }) {
  const status = statusLabel(project.status, project.progress)
  return (
    <Link
      href={`/work?project=${project.id}`}
      className="flex gap-3 rounded-2xl border p-3"
      style={{ background: mobileTheme.cardBg, borderColor: mobileTheme.border, marginLeft: indent ? 12 : 0 }}
    >
      <div className="w-1 shrink-0 rounded-full" style={{ background: mobileTheme.accent }} />
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: mobileTheme.accentSoft }}>
        <FolderKanban className="h-6 w-6" style={{ color: mobileTheme.accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-bold" style={{ color: mobileTheme.ink }}>{project.name}</span>
          <MobileStatusPill label={status.label} tone={status.tone} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: mobileTheme.muted }}>
          <span className="inline-flex items-center gap-1"><ClipboardCheck className="h-3.5 w-3.5" />{taskCount} tâches</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatRange(project.startDate, project.endDate)}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: mobileTheme.accentSofter }}>
            <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: mobileTheme.accent }} />
          </div>
          <span className="text-sm font-bold" style={{ color: mobileTheme.ink }}>{project.progress}%</span>
        </div>
      </div>
    </Link>
  )
}

/** Mobile-only "Projets" screen: search, status filters, and projects
 * grouped with their sub-projects indented underneath — mirrors the
 * Flutter app's card layout. Rendered under `md:hidden`. */
export function MobileProjectsScreen({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")

  const taskCountByProject = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) map.set(t.projectId, (map.get(t.projectId) || 0) + 1)
    return map
  }, [tasks])

  const roots = React.useMemo(() => {
    const byParent = new Map<string, Project[]>()
    for (const p of projects) {
      if (p.parentProjectId) {
        byParent.set(p.parentProjectId, [...(byParent.get(p.parentProjectId) || []), p])
      }
    }
    return projects
      .filter((p) => !p.parentProjectId)
      .map((p) => ({ project: p, children: byParent.get(p.id) || [] }))
  }, [projects])

  const matchesFilter = (p: Project) => {
    if (filter === "active") return p.progress < 100
    if (filter === "done") return p.progress >= 100
    if (filter === "late") return p.status === "off-track" && p.progress < 100
    return true
  }

  const filtered = roots
    .filter(({ project }) => project.name.toLowerCase().includes(query.toLowerCase()))
    .filter(({ project }) => matchesFilter(project))

  const activeCount = projects.filter((p) => p.progress < 100).length
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0

  return (
    <div className="md:hidden" style={{ background: mobileTheme.pageBg }}>
      <MobileHeader icon={<Layers className="h-5 w-5 text-white" />} title="Projets" subtitle="Gérez et suivez tous vos projets" />

      <div className="-mt-4 space-y-4 px-4 pb-6">
        <div className="flex gap-3">
          <MobileStatCard icon={<FolderKanban className="h-5 w-5" />} value={`${activeCount}`} label="Projets actifs" />
          <MobileStatCard icon={<ClipboardList className="h-5 w-5" />} value={`${tasks.length}`} label="Tâches totales" />
          <MobileStatCard icon={<TrendingUp className="h-5 w-5" />} value={`${avgProgress}%`} label="Avancement moyen" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border px-4 py-2.5" style={{ background: mobileTheme.cardBg, borderColor: mobileTheme.border }}>
            <Search className="h-4 w-4" style={{ color: mobileTheme.muted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un projet..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: mobileTheme.ink }}
            />
          </div>
          <button
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border"
            style={{ background: mobileTheme.accentSoft, borderColor: mobileTheme.border, color: mobileTheme.accent }}
            aria-label="Filtres"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            ["all", "Tous"],
            ["active", "Actifs"],
            ["late", "En retard"],
            ["done", "Terminés"],
          ] as [Filter, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold"
              style={
                filter === value
                  ? { background: mobileTheme.headerFrom, color: "white" }
                  : { background: mobileTheme.accentSofter, color: mobileTheme.muted }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(({ project, children }) => (
            <div key={project.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider" style={{ color: mobileTheme.ink }}>
                <Layers className="h-3.5 w-3.5" />
                Projets
              </div>
              <ProjectRow project={project} taskCount={taskCountByProject.get(project.id) || 0} />
              {children.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider" style={{ color: mobileTheme.ink }}>
                    <Layers className="h-3.5 w-3.5" />
                    Sous-projets ({children.length})
                  </div>
                  {children.map((child) => (
                    <ProjectRow key={child.id} project={child} taskCount={taskCountByProject.get(child.id) || 0} indent />
                  ))}
                </>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border p-8 text-center text-sm" style={{ background: mobileTheme.cardBg, borderColor: mobileTheme.border, color: mobileTheme.muted }}>
              Aucun projet trouvé.
            </div>
          )}
        </div>
      </div>

      <Link
        href="/create/project"
        className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full shadow-lg"
        style={{ background: mobileTheme.accent }}
        aria-label="Nouveau projet"
      >
        <Plus className="h-6 w-6 text-white" />
      </Link>
    </div>
  )
}
