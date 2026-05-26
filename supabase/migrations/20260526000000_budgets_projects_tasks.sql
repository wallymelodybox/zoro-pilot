-- Migration to add budget fields to projects and tasks

-- Add budget column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC NULL;

-- Add budget column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget NUMERIC NULL;
