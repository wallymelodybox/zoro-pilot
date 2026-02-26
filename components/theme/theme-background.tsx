"use client"

import React from "react"
import { useThemeVariant } from "./variant-provider"
import { cn } from "@/lib/utils"

export function ThemeBackground() {
  const { variant } = useThemeVariant()

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* BACKGROUNDS PAR VARIANT */}
      
      {/* 1) COMMAND CENTER (Dark / Futuriste Blue) */}
      {variant === "command-center" && (
        <>
          <div className="absolute inset-0 opacity-70">
            <div className="absolute -top-24 left-1/4 h-120 w-120 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="absolute top-10 right-1/4 h-130 w-130 rounded-full bg-fuchsia-500/12 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-130 w-130 rounded-full bg-indigo-500/12 blur-3xl" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_25%,rgba(255,255,255,0.02))]" />
        </>
      )}

      {/* 2) AI PRODUCTIVITY (Light / Clean) */}
      {variant === "ai-productivity" && (
        <div className="absolute inset-0">
          <div className="absolute -top-20 left-1/4 h-130 w-130 rounded-full bg-violet-200/35 blur-3xl" />
          <div className="absolute top-10 right-1/4 h-130 w-130 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-130 w-130 rounded-full bg-amber-200/25 blur-3xl" />
        </div>
      )}

      {/* 3) EXECUTIVE FUTURIST (Dark / Executive Violet) */}
      {variant === "executive-futurist" && (
        <>
          <div className="absolute top-[-10%] left-[-6%] w-[44%] h-[44%] rounded-full bg-[rgba(236,72,153,0.16)] blur-[120px]" />
          <div className="absolute top-[10%] right-[-8%] w-[36%] h-[36%] rounded-full bg-[rgba(168,85,247,0.14)] blur-[110px]" />
          <div className="absolute bottom-[0%] left-[25%] w-[40%] h-[40%] rounded-full bg-[rgba(244,114,182,0.12)] blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.65),transparent_55%)]" />
        </>
      )}
    </div>
  )
}
