
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

export function useSupabaseData() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])
  const [checkins, setCheckins] = useState<OKRCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const supabase = createClient()

  async function fetchData() {
    setLoading(true)
    
    try {
      // Fetch everything in parallel
      const [
        { data: projectsData, error: projectsError },
        { data: tasksData },
        { data: objectivesData },
        { data: pillarsData },
        { data: krsData },
        { data: checkinsData }
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('objectives').select('*'),
        supabase.from('pillars').select('*'),
        supabase.from('key_results').select('*'),
        supabase.from('okr_checkins').select('*').order('date', { ascending: false })
      ])

      // If no data (e.g. tables empty), fallback to mock data for demo continuity
      // Only fallback if we have NO projects AND NO tasks
      const hasNoData = (!projectsData || projectsData.length === 0) && (!tasksData || tasksData.length === 0);
      
      if (hasNoData) {
         console.warn('Supabase data empty, falling back to mock data')
         setProjects(mockProjects)
         setTasks(mockTasks)
         setObjectives(mockObjectives)
         setPillars(mockPillars)
         setUsingMockData(true)
      } else {
        // Map DB fields to our frontend types
        const mappedProjects = projectsData.map((p: any) => ({
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
        }))
        setProjects(mappedProjects)

        if (tasksData) {
          const mappedTasks = tasksData.map((t: any) => ({
            id: t.id,
            projectId: t.project_id,
            title: t.title,
            description: t.description,
            assigneeId: t.assignee_id,
            status: t.status,
            priority: t.priority,
            dueDate: t.due_date,
            linkedKRId: t.linked_kr_id
          }))
          setTasks(mappedTasks)
        }

        if (pillarsData) {
          setPillars(pillarsData as Pillar[])
        }

        if (krsData) {
          const mappedKRs = krsData.map((kr: any) => ({
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
          }))
          setKeyResults(mappedKRs)

          if (objectivesData) {
            const mappedObjectives = objectivesData.map((o: any) => ({
              id: o.id,
              title: o.title,
              pillarId: o.pillar_id,
              ownerId: o.owner_id,
              period: o.period,
              progress: o.progress,
              confidence: o.confidence,
              keyResults: mappedKRs.filter(kr => kr.objectiveId === o.id)
            }))
            setObjectives(mappedObjectives)
          }
        }

        if (checkinsData) {
          const mappedCheckins = checkinsData.map((ci: any) => ({
            id: ci.id,
            keyResultId: ci.key_result_id,
            date: ci.date,
            progressDelta: Number(ci.progress_delta),
            confidence: ci.confidence,
            note: ci.note,
            blocker: ci.blocker
          }))
          setCheckins(mappedCheckins)
        }

        setUsingMockData(false)
      }
    } catch (e) {
      console.error("Unexpected error fetching data", e)
      setProjects(mockProjects)
      setTasks(mockTasks)
      setObjectives(mockObjectives)
      setPillars(mockPillars)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { projects, tasks, objectives, pillars, keyResults, checkins, loading, usingMockData, refresh: fetchData }
}

