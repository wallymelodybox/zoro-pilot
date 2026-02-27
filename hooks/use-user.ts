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
      // Check for demo bypass in development
      if (typeof window !== 'undefined' && localStorage.getItem('zoro_demo_owner') === 'true') {
        setUser({
          id: 'demo-owner-id',
          email: 'menannzoro@gmail.com',
          name: 'Menann Zoro (Mode Démo)',
          role: 'Propriétaire',
          avatar_url: null,
          team_id: null,
          rbac_role: 'super_admin',
          organization_id: 'demo-org-id',
          organization_name: 'Zoro Pilot Demo',
          organization_logo: undefined,
          onboarding_completed: true
        })
        setLoading(false)
        return
      }

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

  return { user, loading }
}
