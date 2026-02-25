'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assignRoleToUser } from '@/lib/rbac'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  
  if (!name) {
    return { error: 'Le nom du projet est requis.' }
  }

  // Default values for a new project
  // Using Marc Dubois (manager) and Team Produit from seed-data.sql
  const ownerId = 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d' 
  const newProject = {
    name,
    status: 'on-track',
    progress: 0,
    owner_id: ownerId,
    team_id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +90 days
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([newProject])
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return { error: 'Erreur lors de la création du projet.' }
  }

  // Assign 'Manager' role to the creator for this specific project
  try {
    // Note: In a real app, ensure 'Manager' role exists in DB via migration/seed
    await assignRoleToUser(ownerId, 'Manager', 'project', data.id)
  } catch (e) {
    console.error('Failed to assign project role:', e)
    // Don't fail the request, just log it. The project was created.
  }

  revalidatePath('/work')
  revalidatePath('/')
  redirect('/work')
}

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const projectId = formData.get('projectId') as string
  const priority = formData.get('priority') as string || 'medium'
  const status = formData.get('status') as string || 'todo'
  const assigneeId = formData.get('assigneeId') as string || 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d' // Marc Dubois
  const dueDate = formData.get('dueDate') as string

  if (!title) {
    return { error: 'Le titre de la tâche est requis.' }
  }

  const newTask = {
    title,
    // description, // Note: Description field might not exist in the minimal schema inferred from use-supabase.ts, but standard tasks usually have it. We'll skip for now if unsure or add it if schema supports.
    project_id: projectId || null, // Allow standalone tasks if schema permits, otherwise needs a project
    priority,
    status,
    assignee_id: assigneeId,
    due_date: dueDate || null,
  }

  const { error } = await supabase
    .from('tasks')
    .insert([newTask])

  if (error) {
    console.error('Error creating task:', error)
    return { error: 'Erreur lors de la création de la tâche.' }
  }

  revalidatePath('/work')
  revalidatePath('/all-tasks')
  revalidatePath('/my-day')
  
  const redirectPath = formData.get('redirectPath') as string
  if (redirectPath) {
    redirect(redirectPath)
  } else {
    redirect('/work')
  }
}

export async function createList(formData: FormData) {
    // For "List", we can treat it as a Project with a specific type or tag, 
    // or just a simple project for now as per the schema.
    return createProject(formData)
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task status:', error)
    return { error: 'Erreur lors de la mise à jour du statut.' }
  }

  revalidatePath('/work')
  revalidatePath('/all-tasks')
  revalidatePath('/my-day')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    return { error: 'Erreur lors de la suppression de la tâche.' }
  }

  revalidatePath('/work')
  revalidatePath('/all-tasks')
  revalidatePath('/my-day')
  return { success: true }
}
