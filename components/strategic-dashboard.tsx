"use client"

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./strategic-dashboard.module.css";
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
  ShieldAlert,
  Activity,
  Sparkles,
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
} from "recharts";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: React.ReactNode; href: string };

const neon = {
  blue: "from-cyan-400/30 via-sky-500/20 to-indigo-500/30",
  violet: "from-fuchsia-400/25 via-purple-500/15 to-indigo-500/25",
  amber: "from-amber-400/25 via-orange-500/15 to-rose-500/20",
};

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.55)]",
        "overflow-hidden",
        className
      )}
    >
      {/* subtle inner glow */}
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className={cn("absolute -inset-16 blur-3xl bg-linear-to-br", neon.violet)} />
        <div className={cn("absolute -inset-16 blur-3xl bg-linear-to-tr", neon.blue)} />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const styles =
    tone === "good"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
      : tone === "warn"
      ? "border-amber-300/25 bg-amber-400/10 text-amber-200"
      : tone === "bad"
      ? "border-rose-300/25 bg-rose-400/10 text-rose-200"
      : "border-white/15 bg-white/5 text-white/80";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", styles)}>
      {children}
    </span>
  );
}

function ProgressNeon({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r from-cyan-400 via-sky-500 to-fuchsia-500 shadow-[0_0_18px_rgba(56,189,248,0.45)] ${styles.progressBar}`}
          style={{"--progress": `${clamped}%`} as React.CSSProperties}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-white/60">
        <span>0%</span>
        <span className="text-white/75">{clamped}%</span>
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

  const COLORS = ["#38bdf8", "rgba(255,255,255,0.08)"]; // neon cyan + dim track

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
              stroke="rgba(255,255,255,0.10)"
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
        <div className="text-2xl font-semibold tracking-tight text-white">{percent}%</div>
        <div className="text-sm text-white/75">{label}</div>
        {sub ? <div className="text-xs text-white/55">{sub}</div> : null}
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
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5">
            <div className="text-cyan-200">{icon}</div>
          </div>
          <div>
            <div className="text-xs text-white/60">{title}</div>
            <div className="text-xl font-semibold text-white">{value}</div>
          </div>
        </div>
        {delta ? (
          <Chip tone={tone ?? "neutral"}>
            <Activity className="h-3.5 w-3.5" />
            {delta}
          </Chip>
        ) : null}
      </div>
    </GlassCard>
  );
}

export function StrategicDashboard() {
  const pathname = usePathname();
  const nav: NavItem[] = [
    { label: "Accueil", icon: <Home className="h-4 w-4" />, href: "/" },
    { label: "Stratégie & OKR", icon: <Target className="h-4 w-4" />, href: "/strategy" },
    { label: "Projets & Travail", icon: <FolderKanban className="h-4 w-4" />, href: "/work" },
    { label: "Calendrier global", icon: <CalendarDays className="h-4 w-4" />, href: "/calendar" },
    { label: "Ma journée", icon: <Sun className="h-4 w-4" />, href: "/my-day" },
    { label: "Toutes les tâches", icon: <CheckSquare className="h-4 w-4" />, href: "/all-tasks" },
    { label: "Performance & KPI", icon: <BarChart3 className="h-4 w-4" />, href: "/performance" },
    { label: "Recherche", icon: <Search className="h-4 w-4" />, href: "/search" },
    { label: "Boîte de réception", icon: <Inbox className="h-4 w-4" />, href: "/inbox" },
    { label: "Chats", icon: <MessagesSquare className="h-4 w-4" />, href: "/chats" },
    { label: "Paramètres", icon: <Settings className="h-4 w-4" />, href: "/settings" },
  ];

  const radarData = [
    { axe: "Délai", value: 72 },
    { axe: "Budget", value: 64 },
    { axe: "Risque", value: 58 },
    { axe: "Ressources", value: 66 },
    { axe: "Qualité", value: 74 },
  ];

  const barData = [
    { label: "J-3", value: 5 },
    { label: "J-2", value: 9 },
    { label: "Hier", value: 10 },
    { label: "Aujourd’hui", value: 12 },
    { label: "Demain", value: 6 },
  ];

  const [period, setPeriod] = useState<"1mois" | "1trimestre">("1mois");

  return (
    <div className="min-h-screen w-full text-white overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10 bg-[#070A12]" />
      <div className="fixed inset-0 -z-10 opacity-70">
        <div className="absolute -top-24 left-1/4 h-120 w-120 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute top-10 right-1/4 h-130 w-130 rounded-full bg-fuchsia-500/12 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-130 w-130 rounded-full bg-indigo-500/12 blur-3xl" />
      </div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_25%,rgba(255,255,255,0.02))]" />

      <div className="mx-auto flex max-w-350 gap-5 px-4 py-5">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-70 shrink-0 flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 border border-white/10">
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide">ZORO PILOT</div>
                <div className="text-xs text-white/55">Command Center</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-2">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-linear-to-r from-cyan-400/15 via-sky-500/10 to-fuchsia-500/10 border border-white/10 shadow-[0_0_18px_rgba(56,189,248,0.18)]"
                      : "hover:bg-white/5 text-white/80"
                  )}
                >
                  <span className={cn("text-white/80", active && "text-cyan-200")}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-white/60">Mode sécurité</div>
                <div className="mt-1 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-200" />
                  <span className="text-sm font-medium">Accès hiérarchique</span>
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Les options de création dépendent du rôle (DG / PM / Exécutant).
                </div>
              </div>
              <Chip tone="warn">Actif</Chip>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col gap-5">
          {/* Top Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-white/55">Jeudi 26 février</div>
                <div className="text-3xl font-semibold tracking-tight text-white">
                  Bonjour, <span className="text-white/90">Menann Zoro</span> !
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  aria-label="Notifications"
                  className="relative rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                >
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                  <Bell className="h-4 w-4" />
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-linear-to-br from-cyan-400/40 via-sky-500/30 to-fuchsia-500/30 border border-white/10" />
                  <span className="text-white/85">Bonjour Menann Zoro</span>
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Action chips */}
            <div className="flex flex-wrap gap-2">
              <Chip>Profil</Chip>
              <Chip>Organisation</Chip>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition">
                <Plus className="h-4 w-4 text-cyan-200" />
                Ajouter un widget
              </button>
              <Chip tone="neutral">Basculer affichage classique</Chip>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat icon={<BarChart3 className="h-5 w-5" />} title="Total Sales" value="€58,420" delta="+12%" tone="good" />
            <Stat icon={<FolderKanban className="h-5 w-5" />} title="Orders" value="1,250" delta="+8%" tone="good" />
            <Stat icon={<Activity className="h-5 w-5" />} title="Visitors" value="28,450" delta="+15%" tone="good" />
            <Stat icon={<Target className="h-5 w-5" />} title="Revenue" value="€124,300" delta="+18%" tone="good" />
          </div>

          {/* Score + Risk */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <GlassCard className="p-5 xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white/70">Score d’Exécution</div>
                  <div className="mt-1 text-2xl font-semibold">78%</div>
                  <div className="mt-2 max-w-xl text-xs text-white/55">
                    Indice consolidé (OKR, avancement projet, charge, risques, dépendances).
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone="good">Santé stratégique : Stable</Chip>
                  <Chip tone="warn">Risque global : Modéré</Chip>
                </div>
              </div>

              <div className="mt-4">
                <ProgressNeon value={78} />
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/70">Alertes</div>
                <Chip tone="warn">2</Chip>
              </div>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-200 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Dépendance critique</div>
                      <div className="text-xs text-white/60">
                        Une dépendance bloque <span className="text-white/85">Lancement Beta V2</span>.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-200 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Priorité urgente</div>
                      <div className="text-xs text-white/60">Valider les maquettes UX (deadline aujourd’hui).</div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Middle Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Projects */}
            <GlassCard className="p-5 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold">Projets</div>
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition">
                  <Plus className="h-4 w-4 text-cyan-200" />
                  Ajouter
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5">
                      <FolderKanban className="h-5 w-5 text-cyan-200" />
                    </div>
                    <div>
                      <div className="font-medium">Lancement Beta V2</div>
                      <div className="text-xs text-white/55">Pas de tâches, pour le moment</div>
                    </div>
                  </div>
                  <Chip>Projets</Chip>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/55">Lancements</div>
                  <div className="mt-1 text-2xl font-semibold">5</div>
                  <div className="mt-2 text-xs text-white/60">+2% vs période</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/55">Tâches terminées</div>
                  <div className="mt-1 text-2xl font-semibold">32</div>
                  <div className="mt-2 text-xs text-white/60">+5% vs période</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/55">Dépendances</div>
                  <div className="mt-1 text-2xl font-semibold">8</div>
                  <div className="mt-2 text-xs text-white/60">+1% vs période</div>
                </div>
              </div>
            </GlassCard>

            {/* Radar */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">État des Projets</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPeriod("1mois")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs border transition-colors",
                      period === "1mois"
                        ? "border-white/20 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    1 mois
                  </button>
                  <button
                    onClick={() => setPeriod("1trimestre")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs border transition-colors",
                      period === "1trimestre"
                        ? "border-white/20 bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    1 trimestre
                  </button>
                </div>
              </div>

              <div className="mt-4 h-65">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.12)" />
                    <PolarAngleAxis dataKey="axe" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }} />
                    <Radar
                      name="Projets"
                      dataKey="value"
                      stroke="rgba(56,189,248,0.9)"
                      fill="rgba(56,189,248,0.18)"
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,12,18,0.85)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        color: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(10px)",
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Chip tone="good">Qualité stable</Chip>
                <Chip tone="warn">Risque modéré</Chip>
              </div>
            </GlassCard>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Bar */}
            <GlassCard className="p-5 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Historique des Tâches</div>
                <Chip>7 jours</Chip>
              </div>
              <div className="mt-4 h-65">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.10)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,12,18,0.85)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        color: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(10px)",
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[10, 10, 6, 6]}
                      fill="rgba(99,102,241,0.65)"
                      stroke="rgba(56,189,248,0.5)"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Items */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Items en cours</div>
                <Chip tone="neutral">3</Chip>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <div className="text-sm font-medium">Rédiger les specs fonctionnelles</div>
                    <div className="text-xs text-white/55">Priorité : High</div>
                  </div>
                  <Chip tone="warn">high</Chip>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <div className="text-sm font-medium">Valider les maquettes UX</div>
                    <div className="text-xs text-white/55">Priorité : Urgent</div>
                  </div>
                  <Chip tone="bad">urgent</Chip>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <div className="text-sm font-medium">Configurer le serveur de staging</div>
                    <div className="text-xs text-white/55">Priorité : Medium</div>
                  </div>
                  <Chip tone="neutral">medium</Chip>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Donut percent={71} label="Progression" sub="32 / 45" />
              </div>

              <button className="mt-4 w-full rounded-xl border border-white/10 bg-linear-to-r from-cyan-400/20 via-sky-500/15 to-fuchsia-500/15 px-4 py-3 text-sm font-medium hover:bg-white/10 transition shadow-[0_0_22px_rgba(56,189,248,0.18)]">
                + Ajouter une tâche
              </button>
            </GlassCard>
          </div>

          {/* Footer spacer */}
          <div className="h-8" />
        </main>
      </div>
    </div>
  );
}
