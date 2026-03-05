'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserAvatar } from './user-avatar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Camera, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AvatarUploadProps {
  uid: string | null
  url: string | null
  size: number
  onUpload: (url: string) => void
}

export function AvatarUpload({
  uid,
  url,
  size,
  onUpload,
}: AvatarUploadProps) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      setAvatarUrl(url)
    } catch (error) {
      console.log('Error downloading image: ', error)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    if (!uid) {
      alert("Vous devez être connecté pour uploader un avatar.")
      return
    }

    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image à uploader.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      onUpload(filePath)
    } catch (error) {
      toast.error("Erreur lors de l'upload de l'avatar!")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative" style={{ height: size, width: size }}>
      <UserAvatar 
        name={uid || 'Avatar'}
        avatarUrl={avatarUrl}
        fallback={uid?.charAt(0) || 'A'}
        className={cn('h-full w-full text-2xl', uploading && 'opacity-50')}
      />
      <label 
        htmlFor="avatar-upload" 
        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <Camera className="h-8 w-8 text-white" />
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
