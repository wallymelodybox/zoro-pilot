-- Fix RLS policies for invites table
-- Restore the policy that allows admins/executives to manage (insert/update/delete) invites

-- First drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can read own invites" ON invites;
DROP POLICY IF EXISTS "Org Admins can manage invites" ON invites;

-- Re-create the full policy for managing invites
CREATE POLICY "Org Admins can manage invites" ON public.invites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rbac_role IN ('admin', 'executive', 'super_admin')
      AND (organization_id = public.invites.organization_id OR rbac_role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rbac_role IN ('admin', 'executive', 'super_admin')
      AND (organization_id = public.invites.organization_id OR rbac_role = 'super_admin')
    )
  );

-- Re-create the policy for reading invites by token (for the invite page)
CREATE POLICY "Anyone can read valid invite by token" ON public.invites
  FOR SELECT USING (true);
