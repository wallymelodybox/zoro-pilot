'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  avatar_url: string | null
  team_id: string | null
  rbac_role: 'admin' | 'executive' | 'manager' | 'member' | 'viewer' | 'super_admin'
  organization_id: string | null
  organization_name?: string
  organization_logo?: string
  onboarding_completed?: boolean
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(name, logo_url)')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser({
          ...profile,
          organization_name: profile.organizations?.name,
          organization_logo: profile.organizations?.logo_url
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const refresh = () => {
    setLoading(true)
    ;(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setUser(null); setLoading(false); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(name, logo_url)')
        .eq('id', authUser.id)
        .single()
      if (profile) {
        setUser({
          ...profile,
          organization_name: profile.organizations?.name,
          organization_logo: profile.organizations?.logo_url
        })
      }
      setLoading(false)
    })()
  }

  return { user, loading, refresh }
}
