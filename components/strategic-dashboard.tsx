"use client"

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Home,
  Target,
  FolderKanban,
  CalendarDays,
  Sun,
  CheckSquare,
  BarChart3,
  Search,
  Inbox,
  MessagesSquare,
  Settings,
  Plus,
  Bell,
  ChevronDown,
  Sparkles,
  Zap,
  Bot,
  BrainCircuit,
  Cpu,
  ShieldAlert,
  Activity,
  Layers,
  LayoutGrid,
  AlertTriangle,
  Heart
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { cn } from "@/lib/utils";
import { useThemeVariant, type ThemeVariant } from "./theme/variant-provider";
import { WidgetHub, WIDGETS } from "./widget-hub";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

// ─── UTILS ──────────────────────────────────────────────────────────────────

const cx = cn;

const neon = {
  blue: "from-cyan-400/30 via-sky-500/20 to-indigo-500/30",
  violet: "from-fuchsia-400/25 via-purple-500/15 to-indigo-500/25",
  amber: "from-amber-400/25 via-orange-500/15 to-rose-500/20",
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "relative rounded-2xl border border-border bg-card/70 backdrop-blur-xl overflow-hidden",
        "shadow-[0_0_0_1px_var(--glass-border),0_30px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_var(--glass-border),0_30px_80px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-(--glow-opacity)">
        <div className="absolute -inset-16 blur-3xl bg-[radial-gradient(circle_at_30%_30%,var(--glow-1),transparent_55%)]" />
        <div className="absolute -inset-16 blur-3xl bg-[radial-gradient(circle_at_70%_40%,var(--glow-2),transparent_55%)]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: React.ReactNode;
  className?: string;
}) {
  const toneCls =
    tone === "good"
      ? "border-[color:var(--success-border)] bg-[color:var(--success-bg)] text-[color:var(--success-fg)]"
      : tone === "warn"
      ? "border-[color:var(--warning-border)] bg-[color:var(--warning-bg)] text-[color:var(--warning-fg)]"
      : tone === "bad"
      ? "border-[color:var(--danger-border)] bg-[color:var(--danger-bg)] text-[color:var(--danger-fg)]"
      : "border-border/70 bg-muted/40 text-muted-foreground";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
        toneCls,
        className
      )}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cx(
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
  );
}

function Donut({
  percent,
  label,
  sub,
}: {
  percent: number;
  label: string;
  sub?: string;
}) {
  const data = useMemo(
    () => [
      { name: "done", value: percent },
      { name: "left", value: Math.max(0, 100 - percent) },
    ],
    [percent]
  );

  const COLORS = ["var(--primary)", "var(--accent)"];

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
              stroke="var(--border)"
              strokeWidth={1}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight text-foreground">{percent}%</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sub ? <div className="text-xs text-muted-foreground/70">{sub}</div> : null}
      </div>
    </div>
  );
}

function Stat({
  icon,
  title,
  value,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/40 bg-card/20">
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
  );
}

// ─── DASHBOARD VARIANT 1: COMMAND CENTER ────────────────────────────────────

function CommandCenterDashboard({ 
  addedWidgets, 
  onToggleWidget,
  userName,
  orgName
}: { 
  addedWidgets: string[], 
  onToggleWidget: (id: string) => void,
  userName: string,
  orgName: string
}) {
  const [isWidgetHubOpen, setIsWidgetHubOpen] = useState(false);

  const radarData = [
    { axe: "Délai", value: 72 },
    { axe: "Budget", value: 85 },
    { axe: "Scope", value: 65 },
    { axe: "Risque", value: 45 },
    { axe: "Qualité", value: 90 },
  ];

  const barData = [
    { label: "J-3", value: 5 },
    { label: "J-2", value: 9 },
    { label: "Hier", value: 10 },
    { label: "Aujourd'hui", value: 12 },
    { label: "Demain", value: 6 },
  ];

  const [period, setPeriod] = useState<"1mois" | "1trimestre">("1mois");

  return (
    <div className="min-h-screen w-full text-foreground p-5 lg:p-8 bg-transparent">
      <div className="mx-auto max-w-6xl flex flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-foreground/55">Jeudi 26 février</div>
                <div className="text-3xl font-semibold tracking-tight">
                  Bonjour, <span className="text-foreground/90">{userName}</span> !
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/create" className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  Créer
                </Link>
                <div className="h-8 w-px bg-border/40 mx-1" />
                <button className="relative rounded-xl border border-border/40 bg-card/20 px-3 py-2 text-sm hover:bg-card/30 transition" title="Notifications">
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                  <Bell className="h-4 w-4" />
                </button>
                <button className="rounded-xl border border-border/40 bg-card/20 px-3 py-2 text-sm hover:bg-card/30 transition flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-linear-to-br from-cyan-400/40 via-sky-500/30 to-fuchsia-500/30 border border-border/40" />
                  <span className="text-foreground/85">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-foreground/60" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/settings?section=account">
                <Badge className="cursor-pointer hover:bg-muted/60 transition-colors">Profil</Badge>
              </Link>
              <Link href="/settings?section=organization">
                <Badge className="cursor-pointer hover:bg-muted/60 transition-colors">{orgName}</Badge>
              </Link>
              <button 
                onClick={() => setIsWidgetHubOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/20 px-3 py-2 text-xs hover:bg-card/30 transition"
              >
                <Plus className="h-4 w-4 text-primary" />
                Ajouter un widget
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat icon={<BarChart3 className="h-5 w-5" />} title="Score d'Exécution" value="78%" delta="+4%" tone="good" />
            <Stat icon={<FolderKanban className="h-5 w-5" />} title="Projets Actifs" value="12" delta="+2" tone="good" />
            <Stat icon={<Activity className="h-5 w-5" />} title="Tâches du Jour" value="9" delta="+1" tone="good" />
            <Stat icon={<Target className="h-5 w-5" />} title="KPI Suivis" value="24" delta="+0%" tone="neutral" />
          </div>

          {/* Dynamic Widgets Section */}
          {addedWidgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addedWidgets.map(id => {
                const widget = WIDGETS.find(w => w.id === id);
                if (!widget) return null;
                return (
                  <SurfaceCard key={id} className="p-5 flex flex-col h-full group relative">
                    <button 
                      onClick={() => onToggleWidget(id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                      title="Retirer le widget"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-foreground">{widget.title}</div>
                      <Badge className="text-[10px] uppercase tracking-wider">{widget.cat}</Badge>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-35 bg-muted/20 rounded-xl border border-border/40 overflow-hidden">
                      <div className="scale-90">
                        {widget.preview}
                      </div>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SurfaceCard className="p-5 xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Score d'Exécution</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">78%</div>
                  <div className="mt-2 max-w-xl text-xs text-muted-foreground/70">
                    Indice consolidé (OKR, avancement projet, charge, risques, dépendances).
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="good">Santé stratégique : Stable</Badge>
                  <Badge tone="warn">Risque global : Modéré</Badge>
                </div>
              </div>

              <div className="mt-4">
                <ProgressBar value={78} />
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Alertes</div>
                <Badge tone="warn">2</Badge>
              </div>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Dépendance critique</div>
                      <div className="text-xs text-muted-foreground">
                        Une dépendance bloque <span className="text-foreground/85">Lancement Beta V2</span>.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Priorité urgente</div>
                      <div className="text-xs text-muted-foreground">Valider les maquettes UX (deadline aujourd'hui).</div>
                    </div>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SurfaceCard className="p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-foreground">Projets</div>
                <Link href="/create/project" className="inline-flex items-center gap-2 rounded-xl border border-border/40 bg-card/20 px-3 py-2 text-sm hover:bg-card/30 transition">
                  <Plus className="h-4 w-4 text-primary" />
                  Nouveau
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-border/40 bg-card/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/40 bg-card/20">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Lancement Beta V2</div>
                      <div className="text-xs text-muted-foreground">Pas de tâches, pour le moment</div>
                    </div>
                  </div>
                  <Badge>Projets</Badge>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/40 bg-card/20 p-4">
                  <div className="text-xs text-muted-foreground">Lancements</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">5</div>
                  <div className="mt-2 text-xs text-muted-foreground">+2% vs période</div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/20 p-4">
                  <div className="text-xs text-muted-foreground">Tâches terminées</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">32</div>
                  <div className="mt-2 text-xs text-muted-foreground">+5% vs période</div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/20 p-4">
                  <div className="text-xs text-muted-foreground">Dépendances</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">8</div>
                  <div className="mt-2 text-xs text-muted-foreground">+1% vs période</div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-foreground">État des Projets</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPeriod("1mois")}
                    className={cx(
                      "rounded-full px-3 py-1 text-xs border",
                      period === "1mois"
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/40 bg-card/20 hover:bg-card/30"
                    )}
                  >
                    1 mois
                  </button>
                  <button
                    onClick={() => setPeriod("1trimestre")}
                    className={cx(
                      "rounded-full px-3 py-1 text-xs border",
                      period === "1trimestre"
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/40 bg-card/20 hover:bg-card/30"
                    )}
                  >
                    1 trimestre
                  </button>
                </div>
              </div>

              <div className="mt-4 h-65">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="axe" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Radar
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        color: "var(--foreground)",
                        backdropFilter: "blur(10px)",
                      }}
                      labelStyle={{ color: "var(--muted-foreground)" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="good">Qualité stable</Badge>
                <Badge tone="warn">Risque modéré</Badge>
              </div>
            </SurfaceCard>
          </div>

          <div className="h-8" />
        </div>

        <WidgetHub 
          isOpen={isWidgetHubOpen} 
          onClose={() => setIsWidgetHubOpen(false)} 
          addedWidgets={addedWidgets} 
          onToggleWidget={onToggleWidget}
        />
      </div>
  );
}

// ─── DASHBOARD VARIANT 2: AI PRODUCTIVITY ───────────────────────────────────

function AIStatusBadge({
  status = "idle",
  children,
}: {
  status?: "idle" | "thinking" | "active" | "warning";
  children: React.ReactNode;
}) {
  const styles =
    status === "active"
      ? "bg-primary/10 text-primary border-primary/20"
      : status === "thinking"
      ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
      : status === "warning"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : "bg-muted text-muted-foreground border-border";
  
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide uppercase", styles)}>
      {status === "thinking" && <BrainCircuit className="h-3 w-3" />}
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 ring-1 ring-border/50 text-primary">
          {icon}
        </div>
      </div>
    </SurfaceCard>
  );
}

function DonutLight({
  percent,
  sub,
}: {
  percent: number;
  sub: string;
}) {
  const data = useMemo(
    () => [
      { name: "done", value: percent },
      { name: "left", value: Math.max(0, 100 - percent) },
    ],
    [percent]
  );

  const COLORS = ["var(--primary)", "var(--muted)"];

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
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.6}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="text-2xl font-semibold text-foreground">{percent}%</div>
        <div className="text-sm text-muted-foreground">Progression</div>
        <div className="text-xs text-muted-foreground/60">{sub}</div>
      </div>
    </div>
  );
}

function AIProductivityDashboard({ 
  addedWidgets, 
  onToggleWidget,
  userName,
  orgName
}: { 
  addedWidgets: string[], 
  onToggleWidget: (id: string) => void,
  userName: string,
  orgName: string
}) {
  const [isWidgetHubOpen, setIsWidgetHubOpen] = useState(false);
  const [period, setPeriod] = useState<"1mois" | "1trimestre">("1mois");

  const radarData = [
    { axe: "Productivité", value: 85 },
    { axe: "Précision IA", value: 92 },
    { axe: "Vitesse", value: 78 },
    { axe: "Qualité Code", value: 88 },
    { axe: "Docs", value: 70 },
  ];

  const barData = [
    { label: "Lun", value: 12 },
    { label: "Mar", value: 18 },
    { label: "Mer", value: 15 },
    { label: "Jeu", value: 24 },
    { label: "Ven", value: 20 },
    { label: "Sam", value: 8 },
    { label: "Dim", value: 5 },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground p-5 lg:p-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-5">
        <SurfaceCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Jeudi 26 février</div>
                <div className="text-3xl font-semibold tracking-tight">
                  Bonjour, <span className="text-foreground">{userName}</span> !
                </div>
              </div>

              <button className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2 ring-1 ring-border/50 shadow-sm hover:shadow-md transition">
                <div className="h-8 w-8 rounded-full bg-linear-to-br from-sky-200 via-violet-200 to-amber-200 ring-1 ring-border/50" />
                <span className="text-sm text-foreground/80">Bonjour {userName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/settings?section=account">
                <Badge className="cursor-pointer hover:bg-muted/60 transition-colors">Profil</Badge>
              </Link>
              <Link href="/settings?section=organization">
                <Badge className="cursor-pointer hover:bg-muted/60 transition-colors">{orgName}</Badge>
              </Link>
              <button 
                onClick={() => setIsWidgetHubOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs ring-1 ring-border/50 shadow-sm hover:shadow-md transition"
              >
                <Plus className="h-4 w-4 text-primary" />
                Ajouter un widget
              </button>
              <Badge tone="neutral">Basculer affichage classique</Badge>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Synthèse IA du jour</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Aujourd'hui vous êtes à <span className="font-semibold text-foreground">42%</span> de votre capacité d'exécution.
                </div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• 2 projets sont à risque.</li>
                  <li>• 1 dépendance bloque le lancement <span className="font-medium text-foreground">Beta V2</span>.</li>
                  <li>• Vous avez 3 actions critiques aujourd'hui.</li>
                </ul>
              </div>
              <Badge tone="warn">
                <AlertTriangle className="h-3.5 w-3.5" />
                Attention
              </Badge>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Score d'exécution" value="78%" hint="Consolidé OKR + Projets" icon={<Target className="h-5 w-5 text-primary" />} />
            <StatCard title="Projets actifs" value="12" hint="2 à risque" icon={<FolderKanban className="h-5 w-5 text-primary" />} />
            <StatCard title="Tâches du jour" value="9" hint="3 critiques" icon={<CheckSquare className="h-5 w-5 text-primary" />} />
            <StatCard title="KPI suivis" value="24" hint="Mensuel / Trimestriel" icon={<BarChart3 className="h-5 w-5 text-primary" />} />
          </div>

          {/* Dynamic Widgets Section */}
          {addedWidgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addedWidgets.map(id => {
                const widget = WIDGETS.find(w => w.id === id);
                if (!widget) return null;
                return (
                  <SurfaceCard key={id} className="p-5 flex flex-col h-full group relative">
                    <button 
                      onClick={() => onToggleWidget(id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                      title="Retirer le widget"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-foreground">{widget.title}</div>
                      <Badge className="text-[10px] uppercase tracking-wider">{widget.cat}</Badge>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-35 bg-muted/20 rounded-xl border border-border/40 overflow-hidden">
                      <div className="scale-90">
                        {widget.preview}
                      </div>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SurfaceCard className="p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-foreground">Projets</div>
                <Link href="/create/project" className="inline-flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-sm ring-1 ring-border/50 shadow-sm hover:shadow-md transition">
                  <Plus className="h-4 w-4 text-primary" />
                  Nouveau
                </Link>
              </div>

              <div className="mt-4 rounded-3xl bg-card/70 ring-1 ring-border/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent/20 ring-1 ring-border/50">
                      <FolderKanban className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Lancement Beta V2</div>
                      <div className="text-xs text-muted-foreground">Pas de tâches, pour le moment</div>
                    </div>
                  </div>
                  <Badge>Projet</Badge>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <SurfaceCard className="p-4 bg-card/70 shadow-none ring-0">
                  <div className="text-xs text-muted-foreground">Lancements</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">5</div>
                  <div className="mt-2 text-xs text-muted-foreground">+2% vs période</div>
                </SurfaceCard>
                <SurfaceCard className="p-4 bg-card/70 shadow-none ring-0">
                  <div className="text-xs text-muted-foreground">Tâches terminées</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">32</div>
                  <div className="mt-2 text-xs text-muted-foreground">+5% vs période</div>
                </SurfaceCard>
                <SurfaceCard className="p-4 bg-card/70 shadow-none ring-0">
                  <div className="text-xs text-muted-foreground">Dépendances</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground">8</div>
                  <div className="mt-2 text-xs text-muted-foreground">+1% vs période</div>
                </SurfaceCard>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-foreground">État des Projets</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPeriod("1mois")}
                    className={cx(
                      "rounded-full px-3 py-1 text-xs ring-1 transition",
                      period === "1mois" ? "bg-card ring-border/50" : "bg-card/60 ring-border/50 hover:bg-card"
                    )}
                  >
                    1 mois
                  </button>
                  <button
                    onClick={() => setPeriod("1trimestre")}
                    className={cx(
                      "rounded-full px-3 py-1 text-xs ring-1 transition",
                      period === "1trimestre" ? "bg-card ring-border/50" : "bg-card/60 ring-border/50 hover:bg-card"
                    )}
                  >
                    1 trimestre
                  </button>
                </div>
              </div>

              <div className="mt-4 h-65">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="axe" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Radar
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 16,
                        color: "var(--foreground)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                      }}
                      labelStyle={{ color: "var(--muted-foreground)" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="good">Qualité stable</Badge>
                <Badge tone="warn">Risque modéré</Badge>
              </div>
            </SurfaceCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SurfaceCard className="p-5 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-foreground">Historique des Tâches</div>
                <Badge>7 jours</Badge>
              </div>

              <div className="mt-4 h-65">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 16,
                        color: "var(--foreground)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                      }}
                      labelStyle={{ color: "var(--muted-foreground)" }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 8, 8]} fill="var(--primary)" fillOpacity={0.55} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-foreground">Items en cours</div>
                <Badge>3</Badge>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-card/70 ring-1 ring-border/50 p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Rédiger les specs fonctionnelles</div>
                    <div className="text-xs text-muted-foreground">Priorité : High</div>
                  </div>
                  <Badge tone="warn">High</Badge>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-card/70 ring-1 ring-border/50 p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Valider les maquettes UX</div>
                    <div className="text-xs text-slate-500">Priorité : Urgent</div>
                  </div>
                  <Badge tone="bad">Urgent</Badge>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-card/70 ring-1 ring-border/50 p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Configurer le serveur de staging</div>
                    <div className="text-xs text-slate-500">Priorité : Medium</div>
                  </div>
                  <Badge>Medium</Badge>
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-card/70 ring-1 ring-border/50 p-4">
                <DonutLight percent={71} sub="32 / 45" />
              </div>

              <button className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_50px_var(--glow-primary)] hover:opacity-90 transition">
                + Ajouter une tâche
              </button>
            </SurfaceCard>
          </div>

          <div className="h-8" />
        </div>

        <WidgetHub 
          isOpen={isWidgetHubOpen} 
          onClose={() => setIsWidgetHubOpen(false)} 
          addedWidgets={addedWidgets} 
          onToggleWidget={onToggleWidget}
        />
      </div>
  );
}

// ─── DASHBOARD VARIANT 3: EXECUTIVE FUTURIST ────────────────────────────────

function ExecutiveFuturistDashboard({ 
  addedWidgets, 
  onToggleWidget,
  userName,
  orgName
}: { 
  addedWidgets: string[], 
  onToggleWidget: (id: string) => void,
  userName: string,
  orgName: string
}) {
  const [isWidgetHubOpen, setIsWidgetHubOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "thinking">("idle");

  const chartData = useMemo(
    () => [
      { name: "Mon", manual: 40, ai: 24 },
      { name: "Tue", manual: 30, ai: 13 },
      { name: "Wed", manual: 20, ai: 98 },
      { name: "Thu", manual: 27, ai: 39 },
      { name: "Fri", manual: 18, ai: 48 },
      { name: "Sat", manual: 23, ai: 38 },
      { name: "Sun", manual: 34, ai: 43 },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { label: "Productivity", value: "92%", delta: "+4.2%", icon: <Zap className="h-5 w-5 text-amber-500" /> },
      { label: "Tasks Done", value: "48", delta: "+12", icon: <CheckSquare className="h-5 w-5 text-emerald-600" /> },
      { label: "Active Goals", value: "6", delta: "0", icon: <Target className="h-5 w-5 text-pink-600" /> },
      { label: "AI Saved Time", value: "4.5h", delta: "+1.2h", icon: <Cpu className="h-5 w-5 text-purple-600" /> },
    ],
    []
  );

  const aiReady = aiStatus !== "thinking";

  return (
    <div className="min-h-screen w-full bg-transparent text-foreground font-sans selection:bg-pink-200/30 p-5 lg:p-10">
      <div className="mx-auto flex flex-col max-w-6xl gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Executive Overview
              </h1>
              <p className="text-muted-foreground mt-1">
                Bonjour {userName}, l'IA a analysé vos <span className="font-semibold text-foreground">12</span> tâches prioritaires.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => setIsWidgetHubOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-pink-600/20 bg-pink-600/5 px-4 py-2 text-xs font-semibold text-pink-600 hover:bg-pink-600/10 transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un widget
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-card/70 p-1.5 rounded-full border border-border/60 shadow-sm">
              <div className="flex items-center gap-2 px-4">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide uppercase transition-all",
                    aiStatus === "thinking"
                      ? "bg-pink-600/40 text-pink-600 border-pink-600/15 animate-pulse"
                      : "bg-pink-600/10 text-pink-600 border-pink-600/15"
                  )}
                >
                  {aiStatus === "thinking" ? "AI Analyzing..." : "AI Ready"}
                </span>
              </div>

              <div className="h-8 w-px bg-border/70" />

              <button
                onClick={() => {
                  setAiStatus("thinking");
                  window.setTimeout(() => setAiStatus("idle"), 2500);
                }}
                className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-colors flex items-center gap-2"
                aria-label="Ask Copilot"
              >
                <Bot className="h-4 w-4" />
                Ask Copilot
              </button>

              <div className="hidden lg:flex items-center gap-2 pr-2">
                <div className="h-8 w-8 rounded-full bg-pink-600/15 border border-pink-600/15" />
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </header>

          <SurfaceCard className="p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Synthèse IA stratégique</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Vous êtes à <span className="font-semibold text-primary">67%</span> de votre capacité d'exécution.
                    <span className="ml-2">Focus recommandé : priorités critiques avant 14h.</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="bad">2 projets à risque</Badge>
                    <Badge tone="neutral">1 dépendance bloque Beta V2</Badge>
                    <Badge tone="warn">3 actions critiques</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="rounded-2xl border border-border/70 bg-card px-4 py-2 text-sm font-semibold hover:bg-muted/40 transition">
                  Voir risques
                </button>
                <button className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-95 transition shadow-lg shadow-primary/15">
                  Appliquer suggestions
                </button>
              </div>
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <SurfaceCard key={i} className="p-6 shadow-sm hover:shadow-md hover:border-border/90 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/60">
                    {stat.icon}
                  </div>
                  <Badge tone="neutral" className="font-bold tracking-wider">
                    {stat.delta}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-semibold">{stat.label}</div>
              </SurfaceCard>
            ))}
          </div>

          {/* Dynamic Widgets Section */}
          {addedWidgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addedWidgets.map(id => {
                const widget = WIDGETS.find(w => w.id === id);
                if (!widget) return null;
                return (
                  <SurfaceCard key={id} className="p-6 flex flex-col h-full group relative shadow-sm hover:shadow-md transition-all">
                    <button 
                      onClick={() => onToggleWidget(id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                      title="Retirer le widget"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-foreground">{widget.title}</div>
                      <Badge className="text-[10px] uppercase tracking-wider">{widget.cat}</Badge>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-40 bg-muted/10 rounded-2xl border border-border/40 overflow-hidden">
                      <div className="scale-100">
                        {widget.preview}
                      </div>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <SurfaceCard className="lg:col-span-2 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Performance Flow</h3>
                  <p className="text-sm text-muted-foreground">
                    AI vs Manual execution efficiency
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-primary" /> Manual
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-primary/40" /> AI Assisted
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="manualFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.16} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "1rem",
                        border: "1px solid var(--border)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
                        background: "var(--card)",
                        color: "var(--foreground)",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="manual"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      fill="url(#manualFill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="ai"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#aiFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>

            <div className="flex flex-col gap-8">
              <SurfaceCard className="bg-linear-to-br from-primary/20 to-primary/5 border-none text-foreground p-6 shadow-lg shadow-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary/20 backdrop-blur-md flex items-center justify-center">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">AI Insight</h3>
                    <p className="text-muted-foreground text-xs">
                      {aiReady ? "Actionable suggestion ready" : "Generating insight…"}
                    </p>
                  </div>
                </div>

                <p className="text-foreground/90 text-sm leading-relaxed mb-6">
                  "Vous êtes plus performante le matin. Je suggère de déplacer la réunion 'Design Sync' à 14h
                  pour préserver votre pic d'énergie."
                </p>

                <button className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-sm hover:opacity-90 transition-colors">
                  Appliquer l'optimisation
                </button>
              </SurfaceCard>

              <SurfaceCard className="p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Top Priorities
                  </h3>
                  <Badge tone="neutral">Today</Badge>
                </div>

                <div className="mt-4 space-y-4">
                  {[
                    { label: "Finalize OKR Q3", time: "2h left", color: "bg-primary" },
                    { label: "API Documentation", time: "Tomorrow", color: "bg-amber-500" },
                    { label: "Client Workshop", time: "Today, 4PM", color: "bg-destructive" },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-2 w-2 rounded-full", task.color)} />
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {task.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground">{task.time}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 py-2 text-primary text-sm font-bold hover:bg-primary/10 rounded-xl transition-colors">
                  View all tasks
                </button>
              </SurfaceCard>

              <SurfaceCard className="p-5 lg:hidden shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">AI Tokens</div>
                    <div className="text-xl font-bold text-foreground">84% Capacity</div>
                  </div>
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3">
                  <ProgressBar value={84} />
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>

        <WidgetHub 
          isOpen={isWidgetHubOpen} 
          onClose={() => setIsWidgetHubOpen(false)} 
          addedWidgets={addedWidgets} 
          onToggleWidget={onToggleWidget}
        />
      </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function StrategicDashboard() {
  const { variant } = useThemeVariant();
  const { user, loading: userLoading } = useUser();
  const [addedWidgets, setAddedWidgets] = useState<string[]>([]);

  const handleToggleWidget = (id: string, config?: any) => {
    console.log("Toggling widget:", id, config);
    setAddedWidgets(prev => {
      if (prev.includes(id)) {
        toast.info("Widget retiré du dashboard");
        return prev.filter(w => w !== id);
      }
      toast.success("Widget ajouté avec succès !");
      return [...prev, id];
    });
  };

  if (userLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <Activity className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const userName = user?.name || "Invité";
  const orgName = user?.organization_name || "Zoro Pilot";

  if (variant === "ai-productivity") {
    return <AIProductivityDashboard addedWidgets={addedWidgets} onToggleWidget={handleToggleWidget} userName={userName} orgName={orgName} />;
  }

  if (variant === "executive-futurist") {
    return <ExecutiveFuturistDashboard addedWidgets={addedWidgets} onToggleWidget={handleToggleWidget} userName={userName} orgName={orgName} />;
  }

  return <CommandCenterDashboard addedWidgets={addedWidgets} onToggleWidget={handleToggleWidget} userName={userName} orgName={orgName} />;
}

export default StrategicDashboard;
