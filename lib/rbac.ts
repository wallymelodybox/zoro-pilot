import { createClient } from '@/lib/supabase/server'

export type RoleScope = 'organization' | 'project'

export interface Role {
  id: string
  name: string
  scope: RoleScope
  description?: string
  permissions?: Permission[]
}

export interface Permission {
  id: string
  action: string
  description?: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  scope_id?: string // Project ID if scope is project
  role?: Role
}

/**
 * Checks if a user has a specific permission globally or within a specific scope.
 * This function should be used in Server Actions or Server Components.
 */
export async function hasPermission(
  userId: string,
  action: string,
  scopeId?: string // e.g., projectId
): Promise<boolean> {
  const supabase = await createClient()

  // 1. Check for global permissions (Organization level)
  // We look for roles assigned to the user with scope 'organization' that have the permission
  // Note: This query assumes Supabase relationships are set up correctly. 
  // If not, we might need manual joins or multiple queries.
  // For MVP robustness, we'll fetch user roles and check in code if complex joins fail.
  
  // Fetch all roles for the user
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select(`
      scope_id,
      role:roles (
        id,
        name,
        scope,
        role_permissions (
          permission:permissions (
            action
          )
        )
      )
    `)
    .eq('user_id', userId)

  if (error || !userRoles) {
    console.error('Error checking permissions:', error)
    return false
  }

  // Iterate to find if any role grants the permission
  for (const ur of userRoles) {
    // @ts-ignore - Supabase types might be deep
    const role = ur.role
    if (!role) continue

    // Check Global Roles (Organization Scope)
    if (role.scope === 'organization') {
       // Check if this role has the requested action
       // @ts-ignore
       const hasAction = role.role_permissions.some((rp: any) => rp.permission.action === action)
       if (hasAction) return true
       
       // Special case: 'Propriétaire' or 'Admin' might have implicit * access depending on logic
       if (role.name === 'Propriétaire') return true
    }

    // Check Project Roles (Project Scope)
    if (role.scope === 'project' && ur.scope_id === scopeId) {
       // @ts-ignore
       const hasAction = role.role_permissions.some((rp: any) => rp.permission.action === action)
       if (hasAction) return true
    }
  }

  return false
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      *,
      role:roles (*)
    `)
    .eq('user_id', userId)
  
  return data || []
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  userId: string,
  roleName: string,
  scope: RoleScope,
  scopeId: string | null = null
) {
  const supabase = await createClient()
  
  // 1. Get Role ID
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .eq('scope', scope)
    .single()
    
  if (roleError || !role) {
    throw new Error(`Role ${roleName} not found for scope ${scope}`)
  }

  // 2. Insert User Role
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: role.id,
      scope_id: scopeId
    })

  if (error) {
    console.error('Error assigning role:', error)
    throw error
  }
}
