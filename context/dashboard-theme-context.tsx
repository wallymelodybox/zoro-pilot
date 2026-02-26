"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type DashboardThemeType = "dark" | "light" | "premium"

interface DashboardThemeContextType {
  theme: DashboardThemeType
  setTheme: (theme: DashboardThemeType) => void
}

const DashboardThemeContext = createContext<DashboardThemeContextType | undefined>(undefined)

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DashboardThemeType>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load saved theme from localStorage
    const saved = localStorage.getItem("dashboard-theme") as DashboardThemeType | null
    if (saved) {
      setThemeState(saved)
    }
    setMounted(true)
  }, [])

  const setTheme = (newTheme: DashboardThemeType) => {
    setThemeState(newTheme)
    localStorage.setItem("dashboard-theme", newTheme)
  }

  if (!mounted) return <>{children}</>

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  )
}

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext)
  if (!context) {
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider")
  }
  return context
}

export function useDashboardThemeSafe() {
  const context = useContext(DashboardThemeContext)
  return context || { theme: "light" as const, setTheme: () => {} }
}
