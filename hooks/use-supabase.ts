
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { 
  type Project, 
  type Task, 
  type Objective, 
  type KeyResult, 
  type Pillar, 
  type OKRCheckin,
  projects as mockProjects, 
  tasks as mockTasks,
  objectives as mockObjectives,
  pillars as mockPillars
} from '@/lib/store'

import { useUser } from '@/hooks/use-user'

export function useSupabaseData() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])
  const [checkins, setCheckins] = useState<OKRCheckin[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [projectEvents, setProjectEvents] = useState<any[]>([])
  const [projectDocuments, setProjectDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const supabase = createClient()

  async function fetchData() {
    if (!user?.organization_id) {
      setLoading(false)
      // If no org ID, we are sure there is no data to fetch.
      setProjects([])
      setTasks([])
      setObjectives([])
      setPillars([])
      setKeyResults([])
      setCheckins([])
      setProfiles([])
      setProjectEvents([])
      setProjectDocuments([])
      return
    }

    setLoading(true)
    
    try {
      const orgId = user.organization_id

      // Fetch everything in parallel, filtered by organization_id
      const [
        { data: projectsData, error: projectsError },
        { data: tasksData, error: tasksError },
        { data: objectivesData, error: objectivesError },
        { data: pillarsData, error: pillarsError },
        { data: krsData, error: krsError },
        { data: checkinsData, error: checkinsError },
        { data: profilesData, error: profilesError },
        { data: projectEventsData, error: projectEventsError },
        { data: projectDocumentsData, error: projectDocumentsError }
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('organization_id', orgId),
        supabase.from('tasks').select('*').eq('organization_id', orgId),
        supabase.from('objectives').select('*').eq('organization_id', orgId),
        supabase.from('pillars').select('*').eq('organization_id', orgId),
        supabase.from('key_results').select('*').eq('organization_id', orgId),
        supabase.from('okr_checkins').select('*').eq('organization_id', orgId).order('date', { ascending: false }),
        supabase.from('profiles').select('*').eq('organization_id', orgId),
        supabase.from('project_events').select('*').eq('organization_id', orgId).order('starts_at', { ascending: true }),
        supabase.from('project_documents').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
      ])

      const fetchErrors = [projectsError, tasksError, objectivesError, pillarsError, krsError, checkinsError, profilesError, projectEventsError, projectDocumentsError].filter(Boolean)
      if (fetchErrors.length > 0) {
        console.error('Supabase data fetch errors', fetchErrors)
      }

      if (profilesData) {
        setProfiles(profilesData)
      } else {
        setProfiles([])
      }

      // Map DB fields to our frontend types
      const mappedProjects = projectsData ? projectsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        teamId: p.team_id,
        ownerId: p.owner_id,
        status: p.status,
        startDate: p.start_date,
        endDate: p.end_date,
        progress: p.progress,
        linkedObjectiveIds: [],
        linkedKRIds: []
      })) : []
      setProjects(mappedProjects)

      const mappedTasks = tasksData ? tasksData.map((t: any) => ({
        id: t.id,
        projectId: t.project_id,
        title: t.title,
        description: t.description,
        createdBy: t.created_by,
        assigneeId: t.assignee_id,
        visibility: t.visibility,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        linkedKRId: t.linked_kr_id
      })) : []
      setTasks(mappedTasks)

      setPillars((pillarsData || []) as Pillar[])

      const mappedKRs = krsData ? krsData.map((kr: any) => ({
        id: kr.id,
        objectiveId: kr.objective_id,
        title: kr.title,
        type: kr.type,
        target: Number(kr.target_value),
        current: Number(kr.current_value),
        unit: kr.unit,
        weight: kr.weight,
        confidence: kr.confidence,
        ownerId: kr.owner_id
      })) : []
      setKeyResults(mappedKRs)

      const mappedObjectives = objectivesData ? objectivesData.map((o: any) => ({
        id: o.id,
        title: o.title,
        pillarId: o.pillar_id,
        ownerId: o.owner_id,
        period: o.period,
        progress: o.progress,
        confidence: o.confidence,
        keyResults: mappedKRs.filter(kr => kr.objectiveId === o.id)
      })) : []
      setObjectives(mappedObjectives)

      const mappedCheckins = checkinsData ? checkinsData.map((ci: any) => ({
        id: ci.id,
        keyResultId: ci.key_result_id,
        date: ci.date,
        progressDelta: Number(ci.progress_delta),
        confidence: ci.confidence,
        note: ci.note,
        blocker: ci.blocker
      })) : []
      setCheckins(mappedCheckins)
      setProjectEvents(projectEventsData || [])
      setProjectDocuments(projectDocumentsData || [])

      setUsingMockData(false)
    } catch (e) {
      console.error("Unexpected error fetching data", e)
      setProjects([])
      setTasks([])
      setObjectives([])
      setPillars([])
      setKeyResults([])
      setCheckins([])
      setProjectEvents([])
      setProjectDocuments([])
      setUsingMockData(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  return { projects, tasks, objectives, pillars, keyResults, checkins, profiles, projectEvents, projectDocuments, loading, usingMockData, refresh: fetchData }
}

