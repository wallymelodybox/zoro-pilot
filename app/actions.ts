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
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500))
  const { mockGmailMessages } = await import('@/lib/store')
  return { messages: mockGmailMessages }
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
