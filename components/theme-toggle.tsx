
"use client"

import * as React from "react"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useThemeVariant, type ThemeVariant } from "@/components/theme/variant-provider"

export function ThemeToggle() {
  const { setVariant } = useThemeVariant()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Apparence</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setVariant("command-center")}>
          Option 1 (Command Center)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVariant("ai-productivity")}>
          Option 2 (AI Productivity)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVariant("executive-futurist")}>
          Option 3 (Executive Futurist)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
