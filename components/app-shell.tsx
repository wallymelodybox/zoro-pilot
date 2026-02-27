"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
import { ThemeBackground } from "@/components/theme/theme-background"

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
    <div className="flex h-screen overflow-hidden p-4 gap-4 relative" suppressHydrationWarning>
      <ThemeBackground />
      <div className="flex h-full shrink-0 z-10" suppressHydrationWarning>
        <AppSidebar />
      </div>
      <main className="flex-1 overflow-y-auto bg-transparent z-10 rounded-2xl" suppressHydrationWarning>
        {children}
      </main>
    </div>
  )
}
