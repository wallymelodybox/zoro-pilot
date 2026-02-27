"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useMemo, useState } from "react"
import {
  Target,
  FolderKanban,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  Inbox,
  CalendarDays,
  Sun,
  Layers,
  Sparkles,
  Activity,
  Shield,
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useThemeVariant } from "@/components/theme/variant-provider"
import { useUser } from "@/hooks/use-user"

const cx = cn

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/strategy", label: "Stratégie & OKR", icon: Target },
  { href: "/work", label: "Projets & Travail", icon: FolderKanban },
  { href: "/calendar", label: "Calendrier global", icon: CalendarDays },
  { href: "/my-day", label: "Ma journée", icon: Sun },
  { href: "/all-tasks", label: "Toutes les tâches", icon: Layers },
  { href: "/performance", label: "Performance & KPI", icon: BarChart3 },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/inbox", label: "Boîte de réception", icon: Inbox },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/settings", label: "Paramètres", icon: Settings },
]

/**
 * Sidebar “token-first” :
 * - Couleurs / surfaces via shadcn tokens (bg-background, bg-card, text-foreground, border-border)
 * - Effet glass via CSS vars (var(--glass-bg), var(--glass-border), var(--glass-shadow))
 * - Accent via primary/ring (text-primary, ring-ring)
 */
// ─── TOKEN-FIRST PRIMITIVES (utilisent globals.css + tokens shadcn) ──────────

function SurfaceCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cx(
        "relative rounded-2xl border border-border bg-card/70 backdrop-blur-xl",
        "shadow-[0_0_0_1px_var(--glass-border),0_30px_80px_rgba(0,0,0,0.25)]",
        "dark:shadow-[0_0_0_1px_var(--glass-border),0_30px_80px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {/* glow optionnel via vars (command-center) */}
      <div className="pointer-events-none absolute inset-0 opacity-(--glow-opacity)">
        <div className="absolute -inset-16 blur-3xl bg-[radial-gradient(circle_at_30%_30%,var(--glow-1),transparent_55%)]" />
        <div className="absolute -inset-16 blur-3xl bg-[radial-gradient(circle_at_70%_40%,var(--glow-2),transparent_55%)]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad"
  children: React.ReactNode
}) {
  const toneCls =
    tone === "good"
      ? "border-[color:var(--success-border)] bg-[color:var(--success-bg)] text-[color:var(--success-fg)]"
      : tone === "warn"
      ? "border-[color:var(--warning-border)] bg-[color:var(--warning-bg)] text-[color:var(--warning-fg)]"
      : tone === "bad"
      ? "border-[color:var(--danger-border)] bg-[color:var(--danger-bg)] text-[color:var(--danger-fg)]"
      : "border-border/70 bg-muted/40 text-muted-foreground"

  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", toneCls)}>
      {children}
    </span>
  )
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-primary shadow-[0_0_18px_var(--glow-primary)] transition-all w-(--progress-width)",
            `[--progress-width:${clamped}%]`
          )}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>0%</span>
        <span className="text-foreground/80">{clamped}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

function DonutToken({
  percent,
  label,
  sub,
}: {
  percent: number
  label: string
  sub?: string
}) {
  const data = useMemo(
    () => [
      { name: "done", value: percent },
      { name: "left", value: Math.max(0, 100 - percent) },
    ],
    [percent]
  )

  // chart-1 défini dans globals.css par variant
  const COLORS = ["var(--chart-1)", "color-mix(in oklab, var(--border) 35%, transparent)"]

  return (
    <div className="flex items-center gap-4">
      <div className="h-24 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius="72%"
              outerRadius="100%"
              paddingAngle={1}
              stroke="color-mix(in oklab, var(--border) 65%, transparent)"
              strokeWidth={1}
            >
              {data.map((_: { name: string; value: number }, i: number) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="text-2xl font-semibold tracking-tight text-foreground">{percent}%</div>
        <div className="text-sm text-foreground/80">{label}</div>
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  )
}

function StatToken({
  icon,
  title,
  value,
  delta,
  tone,
}: {
  icon: React.ReactNode
  title: string
  value: string
  delta?: string
  tone?: "neutral" | "good" | "warn" | "bad"
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted/30">
            <div className="text-primary">{icon}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-xl font-semibold text-foreground">{value}</div>
          </div>
        </div>
        {delta ? (
          <Badge tone={tone ?? "neutral"}>
            <Activity className="h-3.5 w-3.5" />
            {delta}
          </Badge>
        ) : null}
      </div>
    </SurfaceCard>
  )
}
export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { variant } = useThemeVariant()
  const { user } = useUser()

  const items = useMemo(() => {
    const base = [...navItems]
    if (user?.rbac_role === 'super_admin' || user?.email === 'menannzoro@gmail.com') {
      base.push({ href: "/bo-zoro-control-2026-secure", label: "Back Office", icon: Shield })
    }
    return base
  }, [user])

  const widthClass =
    variant === "executive-futurist"
      ? (collapsed ? "w-20" : "w-80")
      : (collapsed ? "w-20" : "w-72")

  const asideClass = cn(
    "flex h-full flex-col overflow-hidden transition-all duration-300",
    "border border-border rounded-3xl",
    // Surface: glass overlay + fallback
    "bg-card/40 backdrop-blur-xl",
    // Shadow glass (via CSS var; fonctionne dark/light)
    "shadow-2xl",
    widthClass
  )

  const getItemClass = (isActive: boolean) => {
    return cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition group",
      // Base text color from tokens
      "text-muted-foreground hover:text-foreground",
      // Hover surface
      "hover:bg-accent/35",
      // Active: use ring + primary tint
      isActive &&
        "bg-accent/50 text-foreground ring-1 ring-ring/40 shadow-sm"
    )
  }

  const logoBadgeClass = cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
    "border border-border",
    // glass badge
    "bg-[var(--glass-bg)] backdrop-blur-xl",
    "shadow-[0_0_0_1px_var(--glass-border),0_12px_30px_rgba(0,0,0,0.20)]"
  )

  const subtitle =
    variant === "executive-futurist" ? "Strategic Intelligence" : "Strategic Hub"

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={asideClass}>
        {/* Logo */}
        <div className={cn("p-6", collapsed && "px-4")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className={logoBadgeClass}>
              {/* Accent via ring/primary tokens */}
              <Sparkles className="h-5 w-5 text-primary" />
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-foreground">
                  ZORO PILOT
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                  {subtitle}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto custom-scrollbar">
          {items.map((item, i) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link 
                    href={item.href} 
                    className={cn(getItemClass(isActive), "animate-in fade-in slide-in-from-left-4 duration-300 fill-mode-both")}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className={cn("transition-transform group-hover:scale-110 shrink-0")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-border">
          {/* AI PRODUCTIVITY: mini card (sans hardcode) */}
          {!collapsed && variant === "ai-productivity" && (
            <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">AI Tokens</div>
              <div className="font-bold text-foreground">84% Capacity</div>
              <div className="mt-2 h-1.5 w-full bg-accent/40 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[84%]" />
              </div>
            </div>
          )}

          {/* COMMAND CENTER: mini card (sans hardcode) */}
          {!collapsed && variant === "command-center" && (
            <div className="mb-4 rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3">
              <div className="flex items-center justify-between mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Système</span>
                <span className="text-primary">Actif</span>
              </div>
              <div className="h-1 w-full bg-accent/40 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/4 shadow-[0_0_10px_var(--glow-cyan)]" />
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
              "text-muted-foreground hover:bg-accent/35 hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Développer" : "Réduire"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!collapsed && <span className="text-sm font-medium">Réduire</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}