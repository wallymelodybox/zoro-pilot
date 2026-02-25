import { cn } from "@/lib/utils"
import { type Confidence, type RAGStatus, getRAGBg, getStatusLabel } from "@/lib/store"

export function RAGBadge({
  status,
  className,
}: {
  status: RAGStatus | Confidence
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium font-sans",
        getRAGBg(status),
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {getStatusLabel(status)}
    </span>
  )
}
