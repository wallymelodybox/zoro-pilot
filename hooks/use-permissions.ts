"use client"

import {
  getUserById,
  canEdit as checkCanEdit,
  canView as checkCanView,
  canApprove as checkCanApprove,
  canCreateOKR as checkCanCreateOKR,
  User,
} from "@/lib/store"

// Mock hook - in real app this would use session context
const CURRENT_USER_ID = "u1" // Sarah Chen (Admin)

export function usePermissions() {
  const currentUser = getUserById(CURRENT_USER_ID)

  if (!currentUser) {
    return {
      user: null,
      canEdit: () => false,
      canView: () => false,
      canApprove: () => false,
      canCreateOKR: false,
      role: null,
    }
  }

  return {
    user: currentUser,
    role: currentUser.rbacRole,
    canEdit: (targetOwnerId: string) => checkCanEdit(currentUser, targetOwnerId),
    canView: (targetOwnerId: string) => checkCanView(currentUser, targetOwnerId),
    canApprove: (targetOwnerId: string) => checkCanApprove(currentUser, targetOwnerId),
    canCreateOKR: checkCanCreateOKR(currentUser),
  }
}
