"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FolderKanban, CheckSquare, MessageCircle, CalendarDays, Users, MoreHorizontal } from "lucide-react"
import { mobileTheme } from "./mobile-theme"

const items = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/work", label: "Projets", icon: FolderKanban },
  { href: "/all-tasks", label: "Tâches", icon: CheckSquare },
  { href: "/chats", label: "Messages", icon: MessageCircle },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/crm", label: "Équipe", icon: Users },
  { href: "/settings", label: "Plus", icon: MoreHorizontal },
]

/** Matches the Flutter app's 7-tab bottom bar (Accueil/Projets/Tâches/
 * Messages/Calendrier/Équipe/Plus) instead of the desktop shell's
 * 4-item + Create mobile nav — same dark-green identity as the header. */
export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-1 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 md:hidden"
      style={{ background: mobileTheme.headerFrom }}
    >
      <div className="mx-auto grid max-w-md grid-cols-7 gap-0.5">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[10px] font-medium transition"
              style={{ color: isActive ? mobileTheme.statusGood : "rgba(255,255,255,0.62)" }}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              <span className="w-full truncate text-center leading-none">{item.label}</span>
              {isActive && <span className="mt-0.5 h-0.5 w-4 rounded-full" style={{ background: mobileTheme.statusGood }} />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
