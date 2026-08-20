// Pure role helpers — no Supabase dependency, safe to import from client or
// server code. This is the single source of truth for "who is what" across
// the app; see lib/rbac.ts for the server-side permission checks that build
// on top of it.
//
// Role model:
//   - 'executive' = DG / Owner — the organization's ultimate owner. Only one
//     way to become executive: created via the back-office by the platform
//     super admin (app/bo-zoro-control-2026-secure).
//   - 'admin'      = Admin Organisation — delegated administration. Can be
//     granted by the DG (not yet wired into the invite flow — see
//     app/settings/page.tsx availableRoles()). Shares most day-to-day
//     permissions with the DG (managing projects/tasks/members) but not the
//     owner-level ones: see isOwner() below for what stays DG-only.
//
// `isOrgAdmin` / `isOrgAdminOrSuperAdmin` intentionally keep treating admin
// and executive as equivalent — they gate the broad "can manage this org's
// day-to-day" checks. Use `isOwner` / `isOwnerOrSuperAdmin` for the narrower
// set of actions reserved to the DG alone.

export type RbacRole = 'super_admin' | 'admin' | 'executive' | 'manager' | 'member' | 'viewer'

/** DG/Owner or delegated org admin — day-to-day org management rights. */
export function isOrgAdmin(role?: string | null): boolean {
  return role === 'admin' || role === 'executive'
}

/** DG/Owner, delegated org admin, or the platform super admin. */
export function isOrgAdminOrSuperAdmin(role?: string | null): boolean {
  return role === 'super_admin' || isOrgAdmin(role)
}

/** DG/Owner only — the organization's ultimate owner, not a delegated admin. */
export function isOwner(role?: string | null): boolean {
  return role === 'executive'
}

/** DG/Owner or the platform super admin — for owner-level actions. */
export function isOwnerOrSuperAdmin(role?: string | null): boolean {
  return role === 'super_admin' || isOwner(role)
}
