import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function UserAvatar({
  name,
  fallback,
  className,
}: {
  name: string
  fallback: string
  className?: string
}) {
  return (
    <Avatar className={cn("h-7 w-7", className)}>
      <AvatarFallback className="bg-accent text-accent-foreground text-xs font-sans font-medium">
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}
