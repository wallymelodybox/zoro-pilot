
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { type Project, type Task, projects as mockProjects, tasks as mockTasks } from '@/lib/store'

export function useSupabaseData() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
        
        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')

        // If no data or error (e.g. tables empty or not created yet), fallback to mock data for demo continuity
        if (projectsError || !projectsData || projectsData.length === 0) {
           console.warn('Supabase data empty or error, falling back to mock data:', projectsError)
           setProjects(mockProjects)
           setTasks(mockTasks)
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
              assigneeId: t.assignee_id,
              status: t.status,
              priority: t.priority,
              dueDate: t.due_date,
              linkedKRId: t.linked_kr_id
            }))
            setTasks(mappedTasks)
          }
          setUsingMockData(false)
        }
      } catch (e) {
        console.error("Unexpected error fetching data", e)
        setProjects(mockProjects)
        setTasks(mockTasks)
        setUsingMockData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { projects, tasks, loading, usingMockData }
}

