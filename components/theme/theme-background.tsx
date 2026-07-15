"use client"

import React from "react"

export function ThemeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none" aria-hidden="true">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.055] bg-[radial-gradient(circle_at_center,currentColor_1px,transparent_1.5px)] bg-[size:22px_22px] text-primary" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_13%,transparent),transparent_68%)]" />
    </div>
  )
}
