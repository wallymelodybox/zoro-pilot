-- Migration to add description to tasks table
alter table tasks add column if not exists description text;
