"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Target,
  FolderKanban,
  ClipboardCheck,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Home,
  Search,
  Inbox,
  HelpCircle,
  MoreHorizontal,
  CalendarDays,
  Sun,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChatPanel } from "@/components/chat-panel"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { href: "/create", label: "Créer", icon: PlusCircle },
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

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans font-bold text-sm">
            Z
          </div>
          {!collapsed && (
            <span className="font-sans font-semibold text-sidebar-foreground text-base tracking-tight">
              ZORO PILOT
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors font-sans",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
          
          <div className="my-2 border-t border-sidebar-border/50" />
          
          {/* Secondary Nav Items */}
           <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/help"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors font-sans"
              >
                <HelpCircle className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Aide</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Aide</TooltipContent>}
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/more"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors font-sans"
              >
                <MoreHorizontal className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Plus</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Plus</TooltipContent>}
          </Tooltip>
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors font-sans w-full",
                  collapsed && "justify-center"
                )}
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                {!collapsed && <span>Reduire</span>}
              </button>
            </TooltipTrigger>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
