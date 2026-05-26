'use client'

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

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
  const supabase = createClient()
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (avatarUrl) {
      if (avatarUrl.startsWith('http')) {
        setResolvedAvatarUrl(avatarUrl)
      } else {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(avatarUrl)
        setResolvedAvatarUrl(publicUrl)
      }
    } else {
      setResolvedAvatarUrl(null)
    }
  }, [avatarUrl])

  return (
    <Avatar className={cn("h-7 w-7", className)}>
      {resolvedAvatarUrl && (
        <AvatarImage 
          src={resolvedAvatarUrl} 
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
