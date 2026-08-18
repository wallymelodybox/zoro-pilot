"use client"

import Link from "next/link"
import React from "react"
import { Plus, BarChart3, FolderKanban, Activity } from "lucide-react"
import { MobileHeader } from "./mobile-header"
import { MobileStatCard } from "./mobile-stat-card"
import { mobileTheme } from "./mobile-theme"
import type { DashboardMetrics } from "@/hooks/use-dashboard-metrics"

function DeltaChip({ delta }: { delta: string }) {
  const positive = delta.trim().startsWith("+") || delta.trim() === "0%"
  return (
    <span
      className="mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: positive ? mobileTheme.statusGoodBg : mobileTheme.statusWarnBg,
        color: positive ? mobileTheme.statusGood : mobileTheme.statusWarn,
      }}
    >
      <Activity className="h-3 w-3" />
      {delta}
    </span>
  )
}

/**
 * Mobile-only home screen matching the Flutter app: dark-green wave header,
 * greeting, quick actions, then a stack of full-width stat cards. Rendered
 * under `md:hidden`; the desktop dashboard variants are untouched.
 */
export function MobileDashboard({
  userName,
  metrics,
}: {
  userName: string
  metrics: DashboardMetrics
}) {
  return (
    <div className="md:hidden" style={{ background: mobileTheme.pageBg }}>
      <MobileHeader title={`Bonjour, ${userName} !`} subtitle={metrics.formattedDate} />

      <div className="-mt-4 space-y-4 px-4 pb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold"
            style={{ background: mobileTheme.cardBg, borderColor: mobileTheme.border, color: mobileTheme.ink }}
          >
            <Plus className="h-4 w-4" />
            Créer
          </Link>
        </div>

        <div className="space-y-3">
          <MobileStatCard
            icon={<BarChart3 className="h-5 w-5" />}
            value={`${metrics.executionScore}%`}
            label="Score d'Exécution"
            badge={<DeltaChip delta={metrics.executionDelta} />}
          />
          <MobileStatCard
            icon={<FolderKanban className="h-5 w-5" />}
            value={`${metrics.activeProjectsCount}`}
            label="Projets Actifs"
            badge={<DeltaChip delta={metrics.activeProjectsDelta} />}
          />
          <MobileStatCard
            icon={<Activity className="h-5 w-5" />}
            value={`${metrics.todayTasksCount}`}
            label="Tâches du Jour"
            badge={<DeltaChip delta={metrics.todayTasksDelta} />}
          />
        </div>

        {metrics.topProjects.length > 0 && (
          <div>
            <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wider" style={{ color: mobileTheme.muted }}>
              Projets à surveiller
            </div>
            <div className="space-y-3">
              {metrics.topProjects.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  href={`/work?project=${p.id}`}
                  className="block rounded-2xl border p-4"
                  style={{ background: mobileTheme.cardBg, borderColor: mobileTheme.border }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold" style={{ color: mobileTheme.ink }}>{p.name}</span>
                    <span className="text-sm font-bold" style={{ color: mobileTheme.accent }}>{p.progress}%</span>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: mobileTheme.muted }}>{p.taskCount} tâches</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: mobileTheme.accentSofter }}>
                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: mobileTheme.accent }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
