"use client"

import React from "react"
import { mobileTheme } from "./mobile-theme"

export function MobileStatCard({
  icon,
  value,
  label,
  badge,
}: {
  icon: React.ReactNode
  value: string
  label: string
  badge?: React.ReactNode
}) {
  return (
    <div
      className="flex min-w-[9.5rem] flex-1 flex-col gap-3 rounded-2xl border p-4"
      style={{ background: mobileTheme.cardBg, borderColor: mobileTheme.border }}
    >
      <div className="grid h-11 w-11 place-items-center rounded-full" style={{ background: mobileTheme.accentSoft, color: mobileTheme.accent }}>
        {icon}
      </div>
      <div>
        <div className="text-[26px] font-bold leading-none" style={{ color: mobileTheme.ink }}>{value}</div>
        <div className="mt-1.5 text-sm" style={{ color: mobileTheme.muted }}>{label}</div>
      </div>
      {badge}
    </div>
  )
}

export function MobileStatusPill({ label, tone = "good" }: { label: string; tone?: "good" | "warn" }) {
  const bg = tone === "good" ? mobileTheme.statusGoodBg : mobileTheme.statusWarnBg
  const fg = tone === "good" ? mobileTheme.statusGood : mobileTheme.statusWarn
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: bg, color: fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: fg }} />
      {label}
    </span>
  )
}
