-- ============================================================
-- Migration: 20260821000003_task_lifecycle_subtasks_checklist.sql
-- ============================================================
-- Vision ZP section 12-13 : cycle de vie complet des tâches (+ "à valider" et
-- "annulée"), sous-tâches, checklist, et un flag "en retard" calculé côté
-- base plutôt que recalculé différemment par chaque page côté client.

-- ── 1. Cycle de vie : ajout de 'to_validate' et 'cancelled' ─────────────
-- La contrainte CHECK sur status n'a pas de nom stable (créée sans "constraint
-- name" explicite) ; on la retrouve par introspection avant de la remplacer.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'tasks'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%status%todo%';

  if constraint_name is not null then
    execute format('alter table public.tasks drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('todo', 'in-progress', 'blocked', 'to_validate', 'done', 'cancelled'));

-- ── 2. Sous-tâches ────────────────────────────────────────────────────
alter table public.tasks
  add column if not exists parent_task_id uuid references public.tasks(id) on delete cascade;

create index if not exists tasks_parent_task_id_idx on public.tasks(parent_task_id);

-- ── 3. Flag "en retard" calculé côté base (colonne générée) ─────────────
-- Remplace les deux implémentations client divergentes (work/page.tsx
-- normalisait à minuit et n'excluait que 'done' ; all-tasks/page.tsx
-- comparait à l'instant précis et n'excluait aussi que 'done'). Ici on
-- exclut les deux statuts terminaux (done, cancelled) et on compare par
-- date (comme work/page.tsx, le comportement le plus prévisible pour
-- l'utilisateur : une tâche devient "en retard" à partir du lendemain de
-- son échéance, pas dès l'heure qui suit sa création le jour même).
-- Attention : une colonne générée n'est recalculée qu'au write de la ligne,
-- pas au simple passage de minuit. Un futur job d'alerte "tâches en retard"
-- doit donc requêter `due_date < current_date and status not in (...)`
-- directement plutôt que filtrer sur `is_overdue` seul, sous peine de rater
-- une tâche qui vient de basculer sans avoir été modifiée depuis.
alter table public.tasks
  add column if not exists is_overdue boolean generated always as (
    due_date is not null
    and status not in ('done', 'cancelled')
    and due_date < current_date
  ) stored;

create index if not exists tasks_is_overdue_idx on public.tasks(is_overdue) where is_overdue;

-- ── 4. Checklist ──────────────────────────────────────────────────────
create table if not exists public.task_checklist_items (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  label text not null,
  is_done boolean default false not null,
  position integer default 0 not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists task_checklist_items_task_id_idx on public.task_checklist_items(task_id);

alter table public.task_checklist_items enable row level security;

-- Un item de checklist est visible/gérable par quiconque peut voir/gérer sa
-- tâche parente (même logique que Task visibility read/allowed update).
drop policy if exists "Checklist Read" on public.task_checklist_items;
create policy "Checklist Read" on public.task_checklist_items
  for select to authenticated
  using (
    organization_id = public.user_org_id()
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id
      and (
        t.visibility = 'organization'
        or t.created_by = auth.uid()
        or t.assignee_id = auth.uid()
        or public.can_manage_org_tasks()
      )
      and public.can_view_project(t.project_id)
    )
  );

drop policy if exists "Checklist Manage" on public.task_checklist_items;
create policy "Checklist Manage" on public.task_checklist_items
  for all to authenticated
  using (
    organization_id = public.user_org_id()
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id
      and (t.created_by = auth.uid() or t.assignee_id = auth.uid() or public.can_manage_org_tasks())
    )
  )
  with check (
    organization_id = public.user_org_id()
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id
      and (t.created_by = auth.uid() or t.assignee_id = auth.uid() or public.can_manage_org_tasks())
    )
  );
