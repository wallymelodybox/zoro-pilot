
-- Insert some test users (we use UUIDs that we generate)
-- Note: In a real scenario, you should let Supabase Auth handle user creation
-- and use a trigger to populate this table. Here we insert manually for the demo.

INSERT INTO profiles (id, email, name, role, avatar_url, rbac_role) VALUES
  ('d0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c', 'sarah@example.com', 'Sarah Chen', 'PDG', NULL, 'admin'),
  ('a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d', 'marc@example.com', 'Marc Dubois', 'VP Produit', NULL, 'manager');

-- Insert a Team
INSERT INTO teams (id, name, manager_id) VALUES
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Produit', 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d');

-- Insert a Project
INSERT INTO projects (id, name, team_id, owner_id, status, start_date, end_date, progress) VALUES
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Lancement Beta V2', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d', 'on-track', '2026-03-01', '2026-06-30', 15);

-- Insert Tasks for this Project
INSERT INTO tasks (project_id, title, assignee_id, status, priority, due_date) VALUES
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Rediger les specs fonctionnelles', 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d', 'done', 'high', '2026-03-10'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Valider les maquettes UX', 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d', 'in-progress', 'urgent', '2026-03-20'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Configurer le serveur de staging', 'd0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c', 'todo', 'medium', '2026-04-01');
