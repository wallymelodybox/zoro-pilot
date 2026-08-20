'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assignRoleToUser, hasPermission, isOrgAdminOrSuperAdmin, isOwnerOrSuperAdmin } from '@/lib/rbac'

async function getUserOrg(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (error || !profile?.organization_id) {
    const { data: orgId } = await supabase.rpc('get_my_org_from_members')
    return orgId || null
  }

  return profile?.organization_id || null
}

async function getCurrentProfile(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id, rbac_role')
    .eq('id', userId)
    .single()

  if (profile) return profile

  const { data: profileRows } = await supabase.rpc('get_my_profile')
  return profileRows?.[0] || null
}

function canManageOrgTasks(role?: string | null) {
  return isOrgAdminOrSuperAdmin(role)
}

function canManageOrgProjects(role?: string | null) {
  return isOrgAdminOrSuperAdmin(role)
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)))
}

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Non autorisé' }
  
  const canCreate = await hasPermission(user.id, 'create_project')
  if (!canCreate) return { error: 'Vous n\'avez pas la permission de créer des projets.' }
  
  const name = formData.get('name') as string
  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  const memberIds = uniqueIds([user.id, ...formData.getAll('memberIds').map(String)])
  const budgetValue = formData.get('budget') as string
  const budget = budgetValue ? Number(budgetValue) : null

  if (!name) {
    return { error: 'Le nom du projet est requis.' }
  }

  if (!orgId) {
    return { error: 'Organisation introuvable pour votre compte. Reconnectez-vous ou contactez l’administrateur.' }
  }

  if (!canManageOrgProjects(profile?.rbac_role)) {
    return { error: 'Seul le DG peut créer et structurer les projets de l’organisation.' }
  }

  // Default values for a new project
  const newProject = {
    name,
    status: 'on-track',
    progress: 0,
    owner_id: user.id,
    organization_id: orgId,
    team_id: formData.get('teamId') as string || null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget,
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

  if (memberIds.length > 0) {
    const { data: validMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)
      .in('id', memberIds)

    const validMemberIds = (validMembers || []).map((member: any) => member.id)

    if (validMemberIds.length > 0) {
      const { error: membersError } = await supabase
        .from('project_members')
        .upsert(
          validMemberIds.map((profileId: string) => ({
            organization_id: orgId,
            project_id: data.id,
            profile_id: profileId,
            role: profileId === user.id ? 'owner' : 'member',
            added_by: user.id,
          })),
          { onConflict: 'project_id,profile_id' }
        )

      if (membersError) {
        console.error('Error assigning project members:', membersError)
      }
    }
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

export async function createCommission(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  if (!orgId) return { error: 'Organisation introuvable.' }
  if (!canManageOrgProjects(profile?.rbac_role)) {
    return { error: 'Seul le DG peut ajouter des commissions.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const managerId = formData.get('managerId') as string
  const memberIds = uniqueIds([managerId, ...formData.getAll('memberIds').map(String)])

  if (!name) return { error: 'Le nom de la commission est requis.' }

  if (memberIds.length > 0) {
    const { data: validMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)
      .in('id', memberIds)

    if ((validMembers || []).length !== memberIds.length) {
      return { error: 'Chaque membre de la commission doit appartenir à votre organisation.' }
    }
  }

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name,
      manager_id: managerId || user.id,
      organization_id: orgId,
      type: 'commission',
    })
    .select('id')
    .single()

  if (error || !team) {
    console.error('Error creating commission:', error)
    return { error: 'Erreur lors de la création de la commission.' }
  }

  if (memberIds.length > 0) {
    const { error: membersError } = await supabase
      .from('profiles')
      .update({ team_id: team.id })
      .eq('organization_id', orgId)
      .in('id', memberIds)

    if (membersError) {
      console.error('Error assigning commission members:', membersError)
      return { error: 'Commission créée, mais impossible d’assigner ses membres.' }
    }
  }

  revalidatePath('/work')
  revalidatePath('/settings')
  return { success: true, id: team.id }
}

export async function createSubProject(parentProjectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  if (!orgId) return { error: 'Organisation introuvable.' }
  if (!canManageOrgProjects(profile?.rbac_role)) {
    return { error: 'Seul le DG peut ajouter des sous-projets.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const status = formData.get('status') as string || 'on-track'
  const endDate = formData.get('endDate') as string
  const memberIds = uniqueIds([user.id, ...formData.getAll('memberIds').map(String)])

  if (!name) return { error: 'Le nom du sous-projet est requis.' }

  const { data: parentProject } = await supabase
    .from('projects')
    .select('id, team_id')
    .eq('id', parentProjectId)
    .eq('organization_id', orgId)
    .single()

  if (!parentProject) return { error: 'Projet parent introuvable dans votre organisation.' }

  const { data: subProject, error } = await supabase
    .from('projects')
    .insert({
      name,
      status,
      progress: 0,
      owner_id: user.id,
      organization_id: orgId,
      team_id: parentProject.team_id,
      parent_project_id: parentProjectId,
      start_date: new Date().toISOString().split('T')[0],
      end_date: endDate || null,
    })
    .select('id')
    .single()

  if (error || !subProject) {
    console.error('Error creating sub-project:', error)
    return { error: 'Erreur lors de la création du sous-projet.' }
  }

  const { data: validMembers } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .in('id', memberIds)

  const validMemberIds = (validMembers || []).map((member: any) => member.id)

  if (validMemberIds.length > 0) {
    const { error: membersError } = await supabase
      .from('project_members')
      .upsert(
        validMemberIds.map((profileId: string) => ({
          organization_id: orgId,
          project_id: subProject.id,
          profile_id: profileId,
          role: profileId === user.id ? 'owner' : 'member',
          added_by: user.id,
        })),
        { onConflict: 'project_id,profile_id' }
      )

    if (membersError) {
      console.error('Error assigning sub-project members:', membersError)
    }
  }

  revalidatePath('/work')
  revalidatePath('/')
  return { success: true, id: subProject.id }
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  if (!orgId) return { error: 'Organisation introuvable.' }
  if (!canManageOrgProjects(profile?.rbac_role)) {
    return { error: 'Seul le DG peut modifier un projet de l’organisation.' }
  }

  const name = formData.get('name') as string
  const status = formData.get('status') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const progress = Number(formData.get('progress') || 0)
  const budgetValue = formData.get('budget') as string
  const budget = budgetValue ? Number(budgetValue) : null
  const memberIds = uniqueIds([user.id, ...formData.getAll('memberIds').map(String)])

  if (!name) return { error: 'Le nom du projet est requis.' }

  const { error } = await supabase
    .from('projects')
    .update({
      name,
      status: status || 'on-track',
      start_date: startDate || null,
      end_date: endDate || null,
      progress: Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0)),
      budget,
    })
    .eq('id', projectId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Error updating project:', error)
    return { error: 'Erreur lors de la modification du projet.' }
  }

  const { data: validMembers } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .in('id', memberIds)

  const validMemberIds = (validMembers || []).map((member: any) => member.id)

  await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('organization_id', orgId)
    .not('profile_id', 'in', `(${validMemberIds.join(',') || user.id})`)

  if (validMemberIds.length > 0) {
    const { error: membersError } = await supabase
      .from('project_members')
      .upsert(
        validMemberIds.map((profileId: string) => ({
          organization_id: orgId,
          project_id: projectId,
          profile_id: profileId,
          role: profileId === user.id ? 'owner' : 'member',
          added_by: user.id,
        })),
        { onConflict: 'project_id,profile_id' }
      )

    if (membersError) {
      console.error('Error updating project members:', membersError)
    }
  }

  revalidatePath('/work')
  revalidatePath('/')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  if (!orgId) return { error: 'Organisation introuvable.' }
  if (!isOwnerOrSuperAdmin(profile?.rbac_role)) {
    return { error: 'Seul le DG peut supprimer un projet de l’organisation.' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Error deleting project:', error)
    return { error: 'Erreur lors de la suppression du projet.' }
  }

  revalidatePath('/work')
  revalidatePath('/')
  return { success: true }
}

export async function redirectToAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'menannzoro@gmail.com') {
    return { error: 'Accès refusé.' }
  }
  const adminDomain = process.env.ADMIN_DOMAIN
  if (adminDomain) {
    redirect(`https://${adminDomain}/`)
  } else {
    redirect('/bo-zoro-control-2026-secure')
  }
}

export async function redirectToApp() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
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
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string || 'medium'
  const status = formData.get('status') as string || 'todo'
  const requestedAssigneeId = formData.get('assigneeId') as string
  const requestedAssigneeIds = formData.getAll('assigneeIds').map(String)
  const requestedVisibility = formData.get('visibility') as string
  const dueDate = formData.get('dueDate') as string
  const requestedProgress = Number(formData.get('progress') || 0)
  const budgetValue = formData.get('budget') as string
  const budget = budgetValue ? Number(budgetValue) : null
  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  const isTaskManager = canManageOrgTasks(profile?.rbac_role)

  if (!title) {
    return { error: 'Le titre de la tâche est requis.' }
  }

  if (!orgId) {
    return { error: 'Organisation introuvable pour votre compte. Reconnectez-vous ou contactez l’administrateur.' }
  }

  if (projectId && projectId !== "none") {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', orgId)
      .single()

    if (!project) {
      return { error: 'Projet introuvable dans votre organisation.' }
    }
  }

  let assigneeIds = [user.id]
  let visibility = 'private'

  if (isTaskManager) {
    assigneeIds = uniqueIds(requestedAssigneeIds.length > 0 ? requestedAssigneeIds : [requestedAssigneeId || user.id])
    visibility = requestedVisibility === 'organization' ? 'organization' : 'private'

    const { data: assigneeProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)
      .in('id', assigneeIds)

    if (!assigneeProfiles || assigneeProfiles.length !== assigneeIds.length) {
      return { error: 'Vous ne pouvez assigner une tâche qu’à un membre de votre organisation.' }
    }
  }

  const assigneeId = assigneeIds[0] || user.id
  const taskProgress = Math.max(0, Math.min(100, Number.isFinite(requestedProgress) ? requestedProgress : 0))

  const newTask = {
    title,
    description: description || null,
    project_id: projectId && projectId !== "none" ? projectId : null,
    organization_id: orgId,
    created_by: user.id,
    visibility,
    priority,
    status,
    progress: status === 'done' ? 100 : taskProgress,
    assignee_id: assigneeId,
    due_date: dueDate || null,
    budget,
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert([newTask])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating task:', error)
    return { error: `Erreur lors de la création de la tâche: ${error.message}` }
  }

  if (task?.id) {
    const { error: assigneesError } = await supabase
      .from('task_assignees')
      .upsert(
        assigneeIds.map((profileId) => ({
          organization_id: orgId,
          task_id: task.id,
          profile_id: profileId,
          assigned_by: user.id,
        })),
        { onConflict: 'task_id,profile_id' }
      )

    if (assigneesError) {
      console.error('Error assigning task members:', assigneesError)
    }
  }

  if (task?.id) {
    const profile = await getCurrentProfile(supabase, user.id)
    const actorName = profile?.name || 'Un membre'

    if (visibility === 'organization') {
      await notifyOrganization(
        supabase,
        orgId,
        'Nouvelle tâche',
        `${actorName} a créé la tâche "${title}" pour toute l'organisation.`,
        'task',
        { excludeUserId: user.id, actorId: user.id, link: '/all-tasks' }
      )
    } else {
      const assigneesToNotify = assigneeIds.filter((id) => id !== user.id)
      for (const assigneeId of assigneesToNotify) {
        await createNotification(
          assigneeId,
          'Nouvelle tâche assignée',
          `${actorName} vous a assigné la tâche "${title}".`,
          'task',
          { organizationId: orgId, actorId: user.id, link: '/all-tasks' }
        )
      }
    }
  }

  revalidatePath('/work')
  revalidatePath('/all-tasks')
  revalidatePath('/my-day')

  return { success: true }
}

export async function createProjectEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  if (!orgId) return { error: 'Organisation introuvable.' }

  const projectId = formData.get('projectId') as string
  const title = formData.get('title') as string
  const type = formData.get('type') as string || 'event'
  const startsAt = formData.get('startsAt') as string
  const location = formData.get('location') as string
  const notes = formData.get('notes') as string

  if (!projectId || !title || !startsAt) {
    return { error: 'Projet, titre et date sont requis.' }
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .single()

  if (!project) return { error: 'Projet introuvable dans votre organisation.' }

  const { error } = await supabase
    .from('project_events')
    .insert({
      organization_id: orgId,
      project_id: projectId,
      title,
      type,
      starts_at: startsAt,
      location: location || null,
      notes: notes || null,
      created_by: user.id,
    })

  if (error) {
    console.error('Error creating project event:', error)
    return { error: "Erreur lors de la création de l'événement." }
  }

  revalidatePath('/work')
  revalidatePath('/calendar')
  return { success: true }
}

export async function createProjectDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  if (!orgId) return { error: 'Organisation introuvable.' }

  const projectId = formData.get('projectId') as string
  const name = formData.get('name') as string
  const url = formData.get('url') as string
  const version = formData.get('version') as string || 'v1'
  const fileType = formData.get('fileType') as string

  if (!projectId || !name || !url) {
    return { error: 'Projet, nom et source du document sont requis.' }
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('organization_id', orgId)
    .single()

  if (!project) return { error: 'Projet introuvable dans votre organisation.' }

  const { error } = await supabase
    .from('project_documents')
    .insert({
      organization_id: orgId,
      project_id: projectId,
      name,
      url,
      version,
      file_type: fileType || null,
      created_by: user.id,
    })

  if (error) {
    console.error('Error creating project document:', error)
    return { error: 'Erreur lors de l’ajout du document.' }
  }

  revalidatePath('/work')
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

    // Le profil doit déjà exister (créé par le BO pour les DG, ou par invitation pour les membres).
    // On ne crée jamais de profil ni d'organisation ici.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", user.id)
      .single()

    if (!profile || !profile.organization_id) {
      return { error: "Profil ou organisation introuvable. Contactez votre administrateur." }
    }

    const orgId = profile.organization_id

    // Vérifier s'il existe déjà un canal "Général" pour cette organisation
    const { data: existingChannel } = await supabase
      .from("channels")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", "Général")
      .single()

    if (existingChannel) {
      // S'assurer que l'utilisateur est membre du canal
      const { error: cmError } = await supabase
        .from("channel_members")
        .upsert({ channel_id: existingChannel.id, user_id: user.id })

      if (cmError) console.error("bootstrapChat channel_members upsert error", cmError)
      return { success: true }
    }

    // Créer le canal "Général" s'il n'existe pas encore
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .insert({
        name: "Général",
        type: "public",
        organization_id: orgId,
        context_id: null,
        context_type: null,
      })
      .select("id")
      .single()

    if (channelError || !channel) {
      console.error("bootstrapChat channel error", channelError)
      return { error: channelError?.message || "Erreur création channel" }
    }

    await supabase
      .from("channel_members")
      .insert({ channel_id: channel.id, user_id: user.id })

    revalidatePath("/chats")
    revalidatePath("/inbox")

    return { success: true }
  } catch (e) {
    console.error("bootstrapChat unexpected error", e)
    return { error: e instanceof Error ? e.message : "Erreur inconnue" }
  }
}

export async function sendChatMessage(payload: {
  channelId: string
  content: string
  type?: string
  attachments?: any[] | null
  entityType?: string | null
  entityId?: string | null
  entityTitle?: string | null
  replyToId?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: channel } = await supabase
    .from('channels')
    .select('id, name, type, organization_id')
    .eq('id', payload.channelId)
    .single()

  if (!channel) return { error: 'Canal introuvable.' }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      channel_id: payload.channelId,
      sender_id: user.id,
      content: payload.content,
      type: payload.type || 'text',
      attachments: payload.attachments ?? null,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      entity_title: payload.entityTitle ?? null,
      reply_to_id: payload.replyToId ?? null,
    })
    .select('*')
    .single()

  if (error || !message) {
    console.error('Error sending message:', error)
    return { error: "Erreur lors de l'envoi du message." }
  }

  const profile = await getCurrentProfile(supabase, user.id)
  const senderName = profile?.name || 'Un membre'
  const preview = payload.content?.trim() ? payload.content.slice(0, 140) : 'a envoyé une pièce jointe.'

  const { data: channelMembers, error: membersError } = await supabase
    .from('channel_members')
    .select('user_id')
    .eq('channel_id', channel.id)
    .neq('user_id', user.id)

  if (membersError) {
    console.error('Error fetching channel members for message notification:', membersError)
  } else {
    const recipientIds = uniqueIds((channelMembers || []).map((member: any) => member.user_id))
    if (recipientIds.length > 0) {
      const notificationTitle = channel.type === 'dm'
        ? `Message de ${senderName}`
        : `${senderName} dans #${channel.name}`
      const { error: notificationError } = await supabase.from('notifications').insert(
        recipientIds.map((recipientId) => ({
          user_id: recipientId,
          organization_id: channel.organization_id,
          actor_id: user.id,
          title: notificationTitle,
          content: preview,
          type: 'message',
          link: `/chats?channel=${channel.id}`,
        }))
      )
      if (notificationError) {
        console.error('Error creating message notifications:', notificationError)
      }
    }
  }

  revalidatePath('/chats')
  revalidatePath('/inbox')

  return { success: true, message }
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

async function createNotification(
  userId: string,
  title: string,
  content: string,
  type: 'info' | 'alert' | 'success' | 'task' | 'message' = 'info',
  options?: { organizationId?: string | null; actorId?: string | null; link?: string | null }
) {
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    organization_id: options?.organizationId ?? null,
    actor_id: options?.actorId ?? null,
    title,
    content,
    type,
    link: options?.link ?? null,
  })

  if (error) {
    console.error('Error creating notification:', error)
  }
}

// Notify every member of an organization (optionally excluding one, e.g. the actor)
async function notifyOrganization(
  supabase: any,
  organizationId: string,
  title: string,
  content: string,
  type: 'info' | 'alert' | 'success' | 'task' | 'message' = 'info',
  options?: { excludeUserId?: string | null; actorId?: string | null; link?: string | null }
) {
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('profile_id')
    .eq('organization_id', organizationId)

  if (error || !members) {
    console.error('Error fetching organization members for notification:', error)
    return
  }

  const recipientIds = uniqueIds(
    members
      .map((m: any) => m.profile_id as string)
      .filter((id: string) => id && id !== options?.excludeUserId)
  )

  if (recipientIds.length === 0) return

  const rows = recipientIds.map((userId) => ({
    user_id: userId,
    organization_id: organizationId,
    actor_id: options?.actorId ?? null,
    title,
    content,
    type,
    link: options?.link ?? null,
  }))

  const { error: insertError } = await supabase.from('notifications').insert(rows)
  if (insertError) {
    console.error('Error broadcasting organization notification:', insertError)
  }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const statusProgress = status === 'done' ? 100 : status === 'todo' ? 0 : status === 'in-progress' ? 50 : undefined
  const updatePayload: Record<string, any> = { status }
  if (statusProgress !== undefined) updatePayload.progress = statusProgress
  
  // 1. Update the task status
  const { data: task, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .select('*, projects(*)')
    .single()

  if (error) {
    console.error('Error updating task status:', error)
    return { error: 'Erreur lors de la mise à jour du statut.' }
  }

  // Notification: If task is DONE, notify all organization members
  if (status === 'done' && task.organization_id) {
    const { data: actorProfile } = user ? await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single() : { data: null }

    const actorName = actorProfile?.name || 'Un membre'
    const projectLabel = task.projects?.name ? ` du projet "${task.projects.name}"` : ''

    await notifyOrganization(
      supabase,
      task.organization_id,
      'Tâche terminée',
      `${actorName} a marqué la tâche "${task.title}"${projectLabel} comme terminée.`,
      'task',
      { excludeUserId: user?.id, actorId: user?.id, link: '/all-tasks' }
    )
  }

  // 2. If the task is part of a project, recalculate project progress
  if (task?.project_id) {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status, progress')
      .eq('project_id', task.project_id)

    if (!tasksError && tasks && tasks.length > 0) {
      const progress = Math.round(
        tasks.reduce((sum: number, item: any) => {
          if (typeof item.progress === 'number') return sum + item.progress
          return sum + (item.status === 'done' ? 100 : 0)
        }, 0) / tasks.length
      )

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

export async function updateTaskProgress(taskId: string, progress: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const value = Math.max(0, Math.min(100, Math.round(progress)))
  const status = value >= 100 ? 'done' : value > 0 ? 'in-progress' : 'todo'

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ progress: value, status })
    .eq('id', taskId)
    .select('project_id')
    .single()

  if (error) {
    console.error('Error updating task progress:', error)
    return { error: 'Erreur lors de la mise à jour de la progression.' }
  }

  if (task?.project_id) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, progress')
      .eq('project_id', task.project_id)

    if (tasks && tasks.length > 0) {
      const projectProgress = Math.round(
        tasks.reduce((sum: number, item: any) => sum + Number(item.progress || (item.status === 'done' ? 100 : 0)), 0) / tasks.length
      )

      await supabase
        .from('projects')
        .update({ progress: projectProgress })
        .eq('id', task.project_id)
    }
  }

  revalidatePath('/work')
  revalidatePath('/all-tasks')
  revalidatePath('/my-day')
  revalidatePath('/')
  return { success: true }
}

export async function updateTaskAssignees(taskId: string, assigneeIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  if (!orgId) return { error: 'Organisation introuvable.' }
  if (!canManageOrgTasks(profile?.rbac_role)) {
    return { error: 'Seul le DG peut assigner les tâches à plusieurs membres.' }
  }

  const memberIds = uniqueIds(assigneeIds)

  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('organization_id', orgId)
    .single()

  if (!task) return { error: 'Tâche introuvable dans votre organisation.' }

  if (memberIds.length === 0) {
    const { error: clearError } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId)
      .eq('organization_id', orgId)

    if (clearError) {
      console.error('Error clearing task assignees:', clearError)
      return { error: "Erreur lors du retrait des assignations." }
    }

    await supabase
      .from('tasks')
      .update({ assignee_id: null })
      .eq('id', taskId)
      .eq('organization_id', orgId)

    revalidatePath('/all-tasks')
    revalidatePath('/work')
    revalidatePath('/my-day')
    return { success: true }
  }

  const { data: validMembers } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .in('id', memberIds)

  if (!validMembers || validMembers.length !== memberIds.length) {
    return { error: 'Vous ne pouvez assigner une tâche qu’à des membres de votre organisation.' }
  }

  const { error: deleteError } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('organization_id', orgId)
    .not('profile_id', 'in', `(${memberIds.join(',')})`)

  if (deleteError) {
    console.error('Error pruning task assignees:', deleteError)
    return { error: "Erreur lors de la mise à jour des assignations." }
  }

  const { error: upsertError } = await supabase
    .from('task_assignees')
    .upsert(
      memberIds.map((profileId) => ({
        organization_id: orgId,
        task_id: taskId,
        profile_id: profileId,
        assigned_by: user.id,
      })),
      { onConflict: 'task_id,profile_id' }
    )

  if (upsertError) {
    console.error('Error updating task assignees:', upsertError)
    return { error: "Erreur lors de l’assignation des membres." }
  }

  const { error: taskError } = await supabase
    .from('tasks')
    .update({ assignee_id: memberIds[0] })
    .eq('id', taskId)
    .eq('organization_id', orgId)

  if (taskError) {
    console.error('Error updating primary task assignee:', taskError)
    return { error: "Assignations enregistrées, mais le responsable principal n’a pas pu être mis à jour." }
  }

  revalidatePath('/all-tasks')
  revalidatePath('/work')
  revalidatePath('/my-day')
  return { success: true }
}

export async function createChannel(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

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

  await supabase.from('channel_members').insert({
    channel_id: channel.id,
    user_id: user.id
  })

  revalidatePath('/chats')
  return { success: true, id: channel.id }
}

export async function addProjectMember(projectId: string, profileId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  const profile = await getCurrentProfile(supabase, user.id)
  if (!orgId) return { error: 'Organisation introuvable.' }
  if (!canManageOrgProjects(profile?.rbac_role)) {
    return { error: 'Seul le DG peut ajouter des membres à un projet.' }
  }

  const { data: member } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .eq('organization_id', orgId)
    .single()

  if (!member) {
    return { error: 'Ce membre n’appartient pas à votre organisation.' }
  }

  try {
    const { error } = await supabase
      .from('project_members')
      .upsert({
        organization_id: orgId,
        project_id: projectId,
        profile_id: profileId,
        role: title?.toLowerCase() === 'owner' ? 'owner' : 'member',
        added_by: user.id,
      }, { onConflict: 'project_id,profile_id' })

    if (error) throw error

    await assignRoleToUser(profileId, 'Member', 'project', projectId)
    revalidatePath('/work')
    return { success: true }
  } catch (error) {
    console.error('Error adding project member:', error)
    return { error: 'Erreur lors de l\'ajout du membre.' }
  }
}

export async function addChannelMember(channelId: string, profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  if (!orgId) return { error: 'Organisation introuvable.' }

  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('id', channelId)
    .eq('organization_id', orgId)
    .single()

  if (!channel) return { error: 'Canal introuvable.' }

  const { data: member } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .eq('organization_id', orgId)
    .single()

  if (!member) return { error: 'Ce membre n’appartient pas à votre organisation.' }

  const { error } = await supabase
    .from('channel_members')
    .upsert({ channel_id: channelId, user_id: profileId }, { onConflict: 'channel_id,user_id' })

  if (error) return { error: error.message }

  revalidatePath('/chats')
  return { success: true }
}

export async function removeChannelMember(channelId: string, profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const orgId = await getUserOrg(supabase)
  if (!orgId) return { error: 'Organisation introuvable.' }

  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('id', channelId)
    .eq('organization_id', orgId)
    .single()

  if (!channel) return { error: 'Canal introuvable.' }

  const { error } = await supabase
    .from('channel_members')
    .delete()
    .eq('channel_id', channelId)
    .eq('user_id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/chats')
  return { success: true }
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const title = formData.get('title') as string
  const pillarId = formData.get('pillarId') as string
  const period = formData.get('period') as string || 'T1 2026'
  const ownerId = formData.get('ownerId') as string || user.id
  const orgId = await getUserOrg(supabase)

  if (!title) return { error: 'Le titre de l\'objectif est requis.' }

  const { error } = await supabase
    .from('objectives')
    .insert([{ 
      title, 
      pillar_id: pillarId, 
      period, 
      owner_id: ownerId, 
      organization_id: orgId,
      confidence: 'on-track', 
      progress: 0 
    }])

  if (error) {
    console.error('Error creating objective:', error)
    return { error: 'Erreur lors de la création de l\'objectif.' }
  }

  revalidatePath('/strategy')
  return { success: true }
}

export async function createKeyResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const objectiveId = formData.get('objectiveId') as string
  const title = formData.get('title') as string
  const type = formData.get('type') as string || 'metric'
  const targetValue = parseFloat(formData.get('targetValue') as string || '100')
  const unit = formData.get('unit') as string || '%'
  const weight = parseInt(formData.get('weight') as string || '1')
  const ownerId = formData.get('ownerId') as string || user.id
  const orgId = await getUserOrg(supabase)

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
      organization_id: orgId,
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  // Vérifier que l'utilisateur a le droit de supprimer cette tâche
  const canDelete = await hasPermission(user.id, 'delete_task')
  if (!canDelete) {
    // Fallback: permettre si l'utilisateur est assigné à la tâche
    const { data: task } = await supabase
      .from('tasks')
      .select('assignee_id')
      .eq('id', taskId)
      .single()
    if (!task || task.assignee_id !== user.id) {
      return { error: 'Vous n\'avez pas la permission de supprimer cette tâche.' }
    }
  }

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
