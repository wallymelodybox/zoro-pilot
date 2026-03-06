"use client"

import { useUser } from "@/hooks/use-user"

/**
 * Hook de permissions basé sur l'utilisateur réel connecté via Supabase.
 * Remplace l'ancien mock hardcodé.
 */
export function usePermissions() {
  const { user, loading } = useUser()

  if (!user || loading) {
    return {
      user: null,
      canEdit: () => false,
      canView: () => false,
      canApprove: () => false,
      canCreateOKR: false,
      role: null,
    }
  }

  const role = user.rbac_role as string | null

  const isAdmin = role === 'super_admin' || role === 'admin'
  const isManager = isAdmin || role === 'manager'

  return {
    user,
    role,
    canEdit: (targetOwnerId: string) =>
      isAdmin || user.id === targetOwnerId,
    canView: (_targetOwnerId: string) =>
      true, // Visible si RLS l'autorise
    canApprove: (targetOwnerId: string) =>
      isManager && user.id !== targetOwnerId,
    canCreateOKR: isManager,
  }
}
