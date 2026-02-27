"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
import { ThemeBackground } from "@/components/theme/theme-background"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return (
      <div className="flex h-screen overflow-hidden relative">
        <ThemeBackground />
        <main className="flex-1 overflow-y-auto bg-transparent z-10">
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
