"use client"

import React from "react"
import { useThemeVariant } from "./variant-provider"
import { cn } from "@/lib/utils"

export function ThemeBackground() {
  const { variant } = useThemeVariant()

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none" suppressHydrationWarning>
      {/* BACKGROUNDS PAR VARIANT */}
      
      {/* 1) COMMAND CENTER (Dark / Futuriste Blue) */}
      {variant === "command-center" && (
        <>
          <div className="absolute inset-0 opacity-70" suppressHydrationWarning>
            <div className="absolute -top-24 left-1/4 h-120 w-120 rounded-full bg-cyan-500/15 blur-3xl" suppressHydrationWarning />
            <div className="absolute top-10 right-1/4 h-130 w-130 rounded-full bg-fuchsia-500/12 blur-3xl" suppressHydrationWarning />
            <div className="absolute bottom-0 left-10 h-130 w-130 rounded-full bg-indigo-500/12 blur-3xl" suppressHydrationWarning />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" suppressHydrationWarning />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_25%,rgba(255,255,255,0.02))]" suppressHydrationWarning />
        </>
      )}

      {/* 2) AI PRODUCTIVITY (Light / Clean) */}
      {variant === "ai-productivity" && (
        <div className="absolute inset-0" suppressHydrationWarning>
          <div className="absolute -top-20 left-1/4 h-130 w-130 rounded-full bg-violet-200/35 blur-3xl" suppressHydrationWarning />
          <div className="absolute top-10 right-1/4 h-130 w-130 rounded-full bg-sky-200/35 blur-3xl" suppressHydrationWarning />
          <div className="absolute bottom-0 left-10 h-130 w-130 rounded-full bg-amber-200/25 blur-3xl" suppressHydrationWarning />
        </div>
      )}

      {/* 3) PMO CLARITY (Light / Operational) */}
      {variant === "pmo-clarity" && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.92),rgba(244,248,244,0.72)_44%,rgba(233,240,235,0.88))]" suppressHydrationWarning />
          <div className="absolute inset-0 opacity-[0.42] bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" suppressHydrationWarning />
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(to_bottom,rgba(21,83,45,0.08),transparent)]" suppressHydrationWarning />
        </>
      )}

      {/* 4) EXECUTIVE FUTURIST (Dark / Executive Violet) */}
      {variant === "executive-futurist" && (
        <>
          <div className="absolute top-[-10%] left-[-6%] w-[44%] h-[44%] rounded-full bg-[rgba(236,72,153,0.16)] blur-[120px]" suppressHydrationWarning />
          <div className="absolute top-[10%] right-[-8%] w-[36%] h-[36%] rounded-full bg-[rgba(168,85,247,0.14)] blur-[110px]" suppressHydrationWarning />
          <div className="absolute bottom-[0%] left-[25%] w-[40%] h-[40%] rounded-full bg-[rgba(244,114,182,0.12)] blur-[120px]" suppressHydrationWarning />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.65),transparent_55%)]" suppressHydrationWarning />
        </>
      )}
    </div>
  )
}
