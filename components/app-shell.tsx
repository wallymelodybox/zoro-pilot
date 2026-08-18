"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
import { ThemeBackground } from "@/components/theme/theme-background"
import { IncomingCallListener } from "@/components/incoming-call-listener"
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav"
import { mobileTheme } from "@/components/mobile/mobile-theme"

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
      <main
        className="z-10 min-w-0 flex-1 overflow-y-auto bg-(--mobile-page-bg) pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:rounded-2xl md:bg-transparent md:pb-0"
        style={{ "--mobile-page-bg": mobileTheme.pageBg } as React.CSSProperties}
        suppressHydrationWarning
      >
        {children}
      </main>
      <MobileBottomNav />
      <IncomingCallListener />
    </div>
  )
}
