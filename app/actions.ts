'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assignRoleToUser, hasPermission } from '@/lib/rbac'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Non autorisé' }
  
  const canCreate = await hasPermission(user.id, 'create_project')
  if (!canCreate) return { error: 'Vous n\'avez pas la permission de créer des projets.' }
  
  const name = formData.get('name') as string
  
  if (!name) {
    return { error: 'Le nom du projet est requis.' }
  }

  // Default values for a new project
  const newProject = {
    name,
    status: 'on-track',
    progress: 0,
    owner_id: user.id,
    team_id: formData.get('teamId') as string || null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    await assignRoleToUser(user.id, 'Manager', 'project', data.id)
  } catch (e) {
    console.error('Failed to assign project role:', e)
  }

  revalidatePath('/work')
  revalidatePath('/')
  return { success: true, id: data.id }
}

export async function redirectToAdmin() {
  const adminDomain = process.env.ADMIN_DOMAIN
  if (adminDomain) {
    redirect(`https://${adminDomain}/`)
  } else {
    redirect('/bo-zoro-control-2026-secure')
  }
}

export async function redirectToApp() {
  const appDomain = process.env.APP_DOMAIN
  if (appDomain) {
    redirect(`https://${appDomain}/`)
  } else {
    redirect('/')
  }
}

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }
  
  const projectId = formData.get('projectId') as string
  
  // Check permission: create_task on project scope
  if (projectId && projectId !== "none") {
    const canCreate = await hasPermission(user.id, 'create_task', projectId)
    if (!canCreate) return { error: 'Vous n\'avez pas la permission de créer des tâches dans ce projet.' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string || 'medium'
  const status = formData.get('status') as string || 'todo'
  const assigneeId = formData.get('assigneeId') as string || user.id
  const dueDate = formData.get('dueDate') as string

  if (!title) {
    return { error: 'Le titre de la tâche est requis.' }
  }

  const newTask = {
    title,
    description: description || null,
    project_id: projectId && projectId !== "none" ? projectId : null,
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
    return { error: `Erreur lors de la création de la tâche: ${error.message}` }
  }

  revalidatePath('/work')
  revalidatePath('/all-tasks')
  revalidatePath('/my-day')
  
  return { success: true }
}

export async function bootstrapChat() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("bootstrapChat getUser error", userError)
      return { error: "Utilisateur non authentifié." }
    }

    const email = user.email || `user-${user.id}@example.com`

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email,
        name: email.split("@")[0],
        role: "Membre",
        avatar_url: null,
        team_id: null,
        rbac_role: "member",
        manager_id: null,
      })

    if (profileError) {
      console.error("bootstrapChat profile error", profileError)
      return { error: profileError.message }
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: "Mon organisation" })
      .select("id,name")
      .single()

    if (orgError || !org) {
      console.error("bootstrapChat org error", orgError)
      return { error: orgError?.message || "Erreur création organisation" }
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: org.id,
        profile_id: user.id,
        title: "Owner",
      })

    if (memberError) {
      console.error("bootstrapChat member error", memberError)
      return { error: memberError.message }
    }

    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .insert({
        name: "Général",
        type: "public",
        organization_id: org.id,
        context_id: null,
        context_type: null,
      })
      .select("id")
      .single()

    if (channelError || !channel) {
      console.error("bootstrapChat channel error", channelError)
      return { error: channelError?.message || "Erreur création channel" }
    }

    const { error: cmError } = await supabase
      .from("channel_members")
      .insert({
        channel_id: channel.id,
        user_id: user.id,
      })

    if (cmError) {
      console.error("bootstrapChat channel_members error", cmError)
      return { error: cmError.message }
    }

    revalidatePath("/chats")
    revalidatePath("/inbox")

    return { success: true }
  } catch (e) {
    console.error("bootstrapChat unexpected error", e)
    return { error: e instanceof Error ? e.message : "Erreur inconnue" }
  }
}

export async function getTeamHierarchy(managerId: string) {
  const supabase = await createClient()
  
  // 1. Get all teams managed by this user
  const { data: managedTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('manager_id', managerId)
    
  if (!managedTeams || managedTeams.length === 0) return []
  
  const teamIds = managedTeams.map(t => t.id)
  
  // 2. Recursively find all sub-teams
  // For a pilot, we'll do 2 levels or a simple flat search of sub-teams
  const { data: subTeams } = await supabase
    .from('teams')
    .select('id')
    .in('parent_team_id', teamIds)
    
  if (subTeams && subTeams.length > 0) {
    teamIds.push(...subTeams.map(st => st.id))
  }
  
  return teamIds
}

export async function getManagerViewData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const teamIds = await getTeamHierarchy(user.id)
  
  // If no teams managed, user only sees their own stuff (handled by normal fetch)
  if (teamIds.length === 0) return null
  
  // Fetch projects for these teams
  const { data: teamProjects } = await supabase
    .from('projects')
    .select('*')
    .in('team_id', teamIds)
    
  return { teamProjects, teamIds }
}

async function createNotification(userId: string, title: string, content: string, type: 'info' | 'alert' | 'success' = 'info') {
  const supabase = await createClient()
  
  // Check if messages table can be used for system notifications
  // or if we should create a dedicated notification table
  // For now, we'll send a message to the user's personal channel or just log it
  console.log(`Notification for ${userId}: ${title} - ${content}`)
  
  // In a real app, we'd insert into a 'notifications' table
  // For the demo, let's use the 'messages' table with a 'system' type if a system channel exists
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Update the task status
  const { data: task, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select('*, projects(*)')
    .single()

  if (error) {
    console.error('Error updating task status:', error)
    return { error: 'Erreur lors de la mise à jour du statut.' }
  }

  // Notification: If task is DONE, notify the project owner
  if (status === 'done' && task.projects?.owner_id && task.projects.owner_id !== user?.id) {
    await createNotification(
      task.projects.owner_id, 
      'Tâche terminée', 
      `La tâche "${task.title}" du projet "${task.projects.name}" a été marquée comme terminée.`
    )
  }

  // 2. If the task is part of a project, recalculate project progress
  if (task?.project_id) {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', task.project_id)

    if (!tasksError && tasks && tasks.length > 0) {
      const doneTasks = tasks.filter(t => t.status === 'done').length
      const progress = Math.round((doneTasks / tasks.length) * 100)

      const oldProgress = task.projects?.progress || 0
      
      await supabase
        .from('projects')
        .update({ progress })
        .eq('id', task.project_id)

      // Notification: If project hits 100%, notify the team
      if (progress === 100 && oldProgress < 100) {
         await createNotification(
           task.projects.owner_id,
           'Projet terminé !',
           `Le projet "${task.projects.name}" est désormais à 100%.`,
           'success'
         )
      }

      // 3. If the project is linked to Key Results, update them too
      const { data: linkedKRs } = await supabase
        .from('project_key_results')
        .select('key_result_id')
        .eq('project_id', task.project_id)

      if (linkedKRs && linkedKRs.length > 0) {
        for (const kr of linkedKRs) {
          const { data: krData } = await supabase
            .from('key_results')
            .select('unit, target_value, objective_id, title, owner_id')
            .eq('id', kr.key_result_id)
            .single()

          if (krData && krData.unit === '%') {
            const newValue = Math.min(krData.target_value, progress)
            await supabase
              .from('key_results')
              .update({ current_value: newValue })
              .eq('id', kr.key_result_id)

            // 4. Recalculate Objective Progress
            const { data: krs } = await supabase
              .from('key_results')
              .select('current_value, target_value, weight')
              .eq('objective_id', krData.objective_id)

            if (krs && krs.length > 0) {
              let totalWeight = 0
              let weightedProgress = 0
              krs.forEach(k => {
                const p = Math.min(100, (Number(k.current_value) / Number(k.target_value)) * 100)
                weightedProgress += p * k.weight
                totalWeight += k.weight
              })
              const objProgress = Math.round(weightedProgress / totalWeight)
              
              const { data: objData } = await supabase
                .from('objectives')
                .select('progress, title, owner_id')
                .eq('id', krData.objective_id)
                .single()

              await supabase
                .from('objectives')
                .update({ progress: objProgress })
                .eq('id', krData.objective_id)
                
              // Notification: Objective milestones
              if (objProgress >= 50 && (objData?.progress || 0) < 50) {
                 await createNotification(
                   krData.owner_id,
                   'Objectif à 50%',
                   `L'objectif "${objData?.title}" a franchi la barre des 50% !`
                 )
              }
            }
          }
        }
      }
    }
  }

  revalidatePath('/work')
  revalidatePath('/all-tasks')
  revalidatePath('/my-day')
  revalidatePath('/strategy')
  revalidatePath('/')
  return { success: true }
}

export async function createChannel(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const type = formData.get('type') as string || 'public'
  const organizationId = formData.get('organizationId') as string

  if (!name || !organizationId) {
    return { error: 'Le nom et l\'organisation sont requis.' }
  }

  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .insert({
      name,
      type,
      organization_id: organizationId
    })
    .select('id')
    .single()

  if (channelError || !channel) {
    console.error('Error creating channel:', channelError)
    return { error: 'Erreur lors de la création du channel.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id: user.id
    })
  }

  revalidatePath('/chats')
  return { success: true, id: channel.id }
}

export async function addProjectMember(projectId: string, profileId: string, title: string) {
  const supabase = await createClient()
  
  // In our current schema, we don't have a direct project_members table, 
  // but we can use roles or simply allow access via organization membership.
  // For now, let's assume we want to track it in a separate table if it existed,
  // or use the RBAC system to assign a role.
  
  try {
    await assignRoleToUser(profileId, 'Member', 'project', projectId)
    revalidatePath('/work')
    return { success: true }
  } catch (error) {
    console.error('Error adding project member:', error)
    return { error: 'Erreur lors de l\'ajout du membre.' }
  }
}

// --- GMAIL INTEGRATION (SIMULATED) ---

export async function connectGmail() {
  // In a real app, this would start the Google OAuth flow
  // For the demo, we'll simulate a successful connection
  revalidatePath('/inbox')
  return { success: true, email: 'menannzoro@gmail.com' }
}

export async function fetchGmailMessages() {
  // TODO: Implement real Gmail API integration
  // For now, return empty array — no mock data
  return { messages: [] as import('@/lib/store').GmailMessage[] }
}

// --- OKR ACTIONS ---

export async function createObjective(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const pillarId = formData.get('pillarId') as string
  const period = formData.get('period') as string || 'T1 2026'
  const ownerId = formData.get('ownerId') as string || 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d' // Marc Dubois

  if (!title) return { error: 'Le titre de l\'objectif est requis.' }

  const { error } = await supabase
    .from('objectives')
    .insert([{ title, pillar_id: pillarId, period, owner_id: ownerId, confidence: 'on-track', progress: 0 }])

  if (error) {
    console.error('Error creating objective:', error)
    return { error: 'Erreur lors de la création de l\'objectif.' }
  }

  revalidatePath('/strategy')
  return { success: true }
}

export async function createKeyResult(formData: FormData) {
  const supabase = await createClient()
  
  const objectiveId = formData.get('objectiveId') as string
  const title = formData.get('title') as string
  const type = formData.get('type') as string || 'metric'
  const targetValue = parseFloat(formData.get('targetValue') as string || '100')
  const unit = formData.get('unit') as string || '%'
  const weight = parseInt(formData.get('weight') as string || '1')
  const ownerId = formData.get('ownerId') as string || 'a1b2c3d4-e5f6-4a5b-9c0d-1e2f3a4b5c6d'

  if (!title || !objectiveId) return { error: 'Le titre et l\'objectif sont requis.' }

  const { error } = await supabase
    .from('key_results')
    .insert([{ 
      objective_id: objectiveId, 
      title, 
      type, 
      target_value: targetValue, 
      current_value: 0, 
      unit, 
      weight, 
      confidence: 'on-track',
      owner_id: ownerId 
    }])

  if (error) {
    console.error('Error creating KR:', error)
    return { error: 'Erreur lors de la création du résultat clé.' }
  }

  revalidatePath('/strategy')
  return { success: true }
}

export async function getWeeklySummaryData(userId: string) {
  const supabase = await createClient()
  
  // 1. Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, teams(name)')
    .eq('id', userId)
    .single()
    
  if (!profile) return null

  // 2. Get tasks completed this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0]

  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('*, projects(name)')
    .eq('assignee_id', userId)
    .eq('status', 'done')
    .gte('updated_at', oneWeekAgoStr)

  // 3. Get pending/blocked tasks
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('*, projects(name)')
    .eq('assignee_id', userId)
    .in('status', ['in-progress', 'blocked'])

  // 4. Get active projects for the user's team
  const { data: activeProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('team_id', profile.team_id)
    .neq('status', 'done')

  // 5. Get OKR progress
  const { data: objectives } = await supabase
    .from('objectives')
    .select('*, key_results(*)')
    .eq('owner_id', userId)

  return {
    profile,
    recentTasks: recentTasks || [],
    pendingTasks: pendingTasks || [],
    activeProjects: activeProjects || [],
    objectives: objectives || [],
    generatedAt: new Date().toISOString()
  }
}

export async function createOKRCheckin(formData: FormData) {
  const supabase = await createClient()
  
  const krId = formData.get('krId') as string
  const progressDelta = parseFloat(formData.get('progressDelta') as string || '0')
  const confidence = formData.get('confidence') as string || 'on-track'
  const note = formData.get('note') as string
  const blocker = formData.get('blocker') as string

  if (!krId) return { error: 'Le résultat clé est requis.' }

  // 1. Create the check-in
  const { error: checkinError } = await supabase
    .from('okr_checkins')
    .insert([{ 
      key_result_id: krId, 
      progress_delta: progressDelta, 
      confidence, 
      note, 
      blocker 
    }])

  if (checkinError) {
    console.error('Error creating check-in:', checkinError)
    return { error: 'Erreur lors de l\'enregistrement du check-in.' }
  }

  // 2. Update the Key Result current value
  // Note: For simplicity, we'll just increment the current_value. 
  // In a more robust system, you might sum all check-ins or use the absolute value from the check-in.
  const { data: krData } = await supabase
    .from('key_results')
    .select('current_value, target_value')
    .eq('id', krId)
    .single()

  if (krData) {
    const newValue = Number(krData.current_value) + progressDelta
    await supabase
      .from('key_results')
      .update({ current_value: newValue, confidence })
      .eq('id', krId)

    // 3. Recalculate Objective Progress (Weighted average of KRs)
    // This could be done via a DB trigger for better consistency, but let's do it here for now.
    const { data: objectiveIdData } = await supabase
      .from('key_results')
      .select('objective_id')
      .eq('id', krId)
      .single()

    if (objectiveIdData) {
      const { data: krs } = await supabase
        .from('key_results')
        .select('current_value, target_value, weight')
        .eq('objective_id', objectiveIdData.objective_id)

      if (krs && krs.length > 0) {
        let totalWeight = 0
        let weightedProgress = 0
        
        krs.forEach(kr => {
          const progress = Math.min(100, (Number(kr.current_value) / Number(kr.target_value)) * 100)
          weightedProgress += progress * kr.weight
          totalWeight += kr.weight
        })
        
        const objectiveProgress = Math.round(weightedProgress / totalWeight)
        
        await supabase
          .from('objectives')
          .update({ progress: objectiveProgress })
          .eq('id', objectiveIdData.objective_id)
      }
    }
  }

  revalidatePath('/strategy')
  revalidatePath('/performance')
  revalidatePath('/')
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
