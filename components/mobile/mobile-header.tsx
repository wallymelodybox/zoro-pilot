"use client"

import React from "react"
import { mobileTheme } from "./mobile-theme"
import { NotificationBell } from "@/components/notification-bell"

/**
 * Dark-green header with a decorative bottom wave, matching the Flutter
 * app's mobile screens. The wave is a plain inline SVG (no extra asset) so
 * it scales with the header's width at any viewport.
 */
export function MobileHeader({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <header
      className="relative overflow-hidden px-5 pb-10 pt-[calc(env(safe-area-inset-top)+1.1rem)]"
      style={{ background: `linear-gradient(135deg, ${mobileTheme.headerFrom}, ${mobileTheme.headerTo})` }}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/12">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold leading-tight text-white">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>}
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-white/12 text-white [&_button]:text-white [&_button:hover]:bg-white/15 [&_button]:hover:text-white">
          <NotificationBell />
        </div>
      </div>

      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        fill={mobileTheme.pageBg}
        aria-hidden
      >
        <path d="M0 24 C 100 4, 300 44, 400 16 L 400 40 L 0 40 Z" />
      </svg>
    </header>
  )
}
