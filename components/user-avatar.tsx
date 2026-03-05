import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function UserAvatar({
  name,
  avatarUrl,
  fallback,
  className,
}: {
  name: string
  avatarUrl?: string | null
  fallback: string
  className?: string
}) {
  return (
    <Avatar className={cn("h-7 w-7", className)}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={name} 
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-accent text-accent-foreground text-xs font-sans font-medium">
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}
