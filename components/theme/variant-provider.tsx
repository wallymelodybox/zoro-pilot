"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"

export type ThemeVariant = "command-center" | "ai-productivity" | "executive-futurist"

interface ThemeVariantContextType {
  variant: ThemeVariant
  setVariant: (variant: ThemeVariant) => void
}

const ThemeVariantContext = createContext<ThemeVariantContextType | undefined>(undefined)

const STORAGE_KEY = "dashboard-theme-variant"

export function ThemeVariantProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<ThemeVariant>("command-center")
  const [mounted, setMounted] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeVariant | null) ?? "command-center"
    setVariantState(saved)
    applyVariant(saved)
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyVariant = (v: ThemeVariant) => {
    // 1) variant attribute for CSS tokens
    document.documentElement.setAttribute("data-dashboard-theme", v)

    // 2) sync dark/light via next-themes
    if (v === "ai-productivity") setTheme("light")
    else setTheme("dark")
  }

  const setVariant = (newVariant: ThemeVariant) => {
    setVariantState(newVariant)
    localStorage.setItem(STORAGE_KEY, newVariant)
    applyVariant(newVariant)
  }

  // évite les clignotements SSR → CSR
  if (!mounted) return <>{children}</>

  return (
    <ThemeVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </ThemeVariantContext.Provider>
  )
}

export function useThemeVariant() {
  const context = useContext(ThemeVariantContext)
  if (!context) {
    return { variant: "command-center" as ThemeVariant, setVariant: () => {} }
  }
  return context
}