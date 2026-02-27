"use client"

import React from "react"
import { ThemeBackground } from "@/components/theme/theme-background"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Shield, LayoutDashboard, Settings, LogOut, Command } from "lucide-react"
import { cn } from "@/lib/utils"
import { redirectToApp } from "@/app/actions"

export default function BOLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: "/bo-zoro-control-2026-secure", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bo-zoro-control-2026-secure/licenses", label: "Licences", icon: Shield },
    { href: "/bo-zoro-control-2026-secure/settings", label: "Paramètres", icon: Settings },
  ]

  return (
    <div className="flex h-screen overflow-hidden relative bg-background">
      <ThemeBackground />
      
      {/* BO Specific Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-2xl z-20 flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Command className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold tracking-tight">ZORO ADMIN</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="pt-6 border-t border-border/40">
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault()
              redirectToApp()
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Quitter le BO
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto z-10 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
