"use client"

import Link from "next/link"
import React from "react"
import { Plus } from "lucide-react"
import { AppSidebar, navItems } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
import { ThemeBackground } from "@/components/theme/theme-background"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  ...navItems.filter((item) => ["/", "/work", "/my-day", "/all-tasks"].includes(item.href)),
  { href: "/create", label: "Créer", icon: Plus },
]

function MobileNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {mobileNavItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium text-muted-foreground transition",
                "hover:bg-accent/50 hover:text-foreground active:scale-[0.98]",
                isActive && "bg-accent text-foreground ring-1 ring-ring/25"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="w-full truncate text-center leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAdminDomain, setIsAdminDomain] = React.useState(false)

  React.useEffect(() => {
    // Check for the context cookie set by middleware
    const isContextAdmin = document.cookie.includes('zoro-platform-context=admin')
    if (isContextAdmin) {
      setIsAdminDomain(true)
    }
  }, [])

  const isLoginPage = pathname === "/login"
  const isBOPage = pathname.startsWith("/bo-zoro-control-2026-secure") || isAdminDomain

  if (isLoginPage || isBOPage) {
    return (
      <div className="flex h-screen overflow-hidden relative" suppressHydrationWarning>
        <ThemeBackground />
        <main className="flex-1 overflow-y-auto bg-transparent z-10" suppressHydrationWarning>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex h-svh overflow-hidden p-0 md:gap-4 md:p-4" suppressHydrationWarning>
      <ThemeBackground />
      <div className="z-10 hidden h-full shrink-0 md:flex" suppressHydrationWarning>
        <AppSidebar />
      </div>
      <main className="z-10 min-w-0 flex-1 overflow-y-auto bg-transparent pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:rounded-2xl md:pb-0" suppressHydrationWarning>
        {children}
      </main>
      <MobileNavigation pathname={pathname} />
    </div>
  )
}
