-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('organization', 'project')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, scope)
);

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL UNIQUE, -- e.g., 'create_project', 'delete_task'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Create user_roles table
-- Note: user_id typically references auth.users(id). 
-- For this setup, we'll assume a public.users table exists or just store the UUID if using auth directly.
-- If you have a users table in public, uncomment the reference.
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  scope_id UUID, -- NULL for organization global scope, project_id for project scope
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id, scope_id)
);

-- 5. Seed Data (Roles & Permissions)
DO $$
DECLARE
  -- Role IDs
  owner_role_id UUID;
  admin_role_id UUID;
  manager_org_role_id UUID;
  executor_org_role_id UUID;
  observer_org_role_id UUID;
  
  manager_proj_role_id UUID;
  executor_proj_role_id UUID;
  observer_proj_role_id UUID;

  -- Permission IDs
  perm_manage_org UUID;
  perm_create_project UUID;
  perm_delete_project UUID;
  perm_create_task UUID;
  perm_edit_task UUID;
  perm_delete_task UUID;
  perm_view_data UUID;
BEGIN
  -- Create Organization Roles
  INSERT INTO roles (name, scope, description) VALUES ('Propriétaire', 'organization', 'Accès total') RETURNING id INTO owner_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Admin', 'organization', 'Administration globale') RETURNING id INTO admin_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Manager', 'organization', 'Gestion opérationnelle') RETURNING id INTO manager_org_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Exécutant', 'organization', 'Production') RETURNING id INTO executor_org_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Observateur', 'organization', 'Lecture seule') RETURNING id INTO observer_org_role_id;

  -- Create Project Roles
  INSERT INTO roles (name, scope, description) VALUES ('Manager', 'project', 'Chef de projet') RETURNING id INTO manager_proj_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Exécutant', 'project', 'Membre du projet') RETURNING id INTO executor_proj_role_id;
  INSERT INTO roles (name, scope, description) VALUES ('Observateur', 'project', 'Invité') RETURNING id INTO observer_proj_role_id;

  -- Create Permissions
  INSERT INTO permissions (action, description) VALUES ('manage_organization', 'Gérer l''organisation') RETURNING id INTO perm_manage_org;
  INSERT INTO permissions (action, description) VALUES ('create_project', 'Créer des projets') RETURNING id INTO perm_create_project;
  INSERT INTO permissions (action, description) VALUES ('delete_project', 'Supprimer des projets') RETURNING id INTO perm_delete_project;
  INSERT INTO permissions (action, description) VALUES ('create_task', 'Créer des tâches') RETURNING id INTO perm_create_task;
  INSERT INTO permissions (action, description) VALUES ('edit_task', 'Modifier des tâches') RETURNING id INTO perm_edit_task;
  INSERT INTO permissions (action, description) VALUES ('delete_task', 'Supprimer des tâches') RETURNING id INTO perm_delete_task;
  INSERT INTO permissions (action, description) VALUES ('view_data', 'Voir les données') RETURNING id INTO perm_view_data;

  -- Assign Permissions to Roles (Examples)
  
  -- Owner: All permissions (conceptually, usually handled by checking role name or specific super-admin flag, but let's add specific ones)
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_manage_org);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_create_project);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_delete_project);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (owner_role_id, perm_view_data);

  -- Admin: Create projects, view data
  INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm_create_project);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (admin_role_id, perm_view_data);

  -- Project Manager: Create/Edit/Delete tasks in their project
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_create_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_edit_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_delete_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_proj_role_id, perm_view_data);

  -- Project Executor: Create/Edit tasks
  INSERT INTO role_permissions (role_id, permission_id) VALUES (executor_proj_role_id, perm_create_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (executor_proj_role_id, perm_edit_task);
  INSERT INTO role_permissions (role_id, permission_id) VALUES (executor_proj_role_id, perm_view_data);

  -- Project Observer: View only
  INSERT INTO role_permissions (role_id, permission_id) VALUES (observer_proj_role_id, perm_view_data);

END $$;
