"use client";

import * as React from "react";
import { useThemeVariant, type ThemeVariant } from "./variant-provider";
import { cn } from "@/lib/utils";

const items: { id: ThemeVariant; label: string }[] = [
  { id: "command-center", label: "Futuriste" },
  { id: "ai-productivity", label: "Productivity" },
  { id: "executive-futurist", label: "Féminin" },
];

export function ThemeVariantSwitch({ className }: { className?: string }) {
  const { variant, setVariant } = useThemeVariant();

  return (
    <div className={cn("inline-flex rounded-2xl border border-border bg-card p-1", className)}>
      {items.map((it) => {
        const active = variant === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setVariant(it.id)}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-xl transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}