"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
import { ThemeBackground } from "@/components/theme/theme-background"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden">
      <ThemeBackground />
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-transparent">
        {children}
      </main>
    </div>
  )
}
