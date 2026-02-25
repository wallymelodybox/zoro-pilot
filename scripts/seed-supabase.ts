
import { createClient } from '@supabase/supabase-js'
import { 
  users, 
  teams, 
  pillars, 
  objectives, 
  projects, 
  tasks, 
  checkins, 
  channels, 
  messages 
} from '@/lib/store'

// This script is meant to be run manually or via a special admin route
// It requires SERVICE_ROLE_KEY to bypass RLS and insert data with specific IDs
// DO NOT expose this in client-side code

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase URL or Service Key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function seed() {
  console.log('🌱 Starting seed...')

  // 1. Users (Profiles)
  // Note: In a real app, you'd create auth users first. Here we assume we just populate the profiles table.
  // Ideally, these IDs should match auth.users IDs.
  console.log('Creating users...')
  for (const user of users) {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, // Warning: This requires the ID to be a valid UUID. The demo IDs (u1, u2) are not UUIDs.
                   // For this seed to work, you MUST change demo IDs to UUIDs or change the DB schema to text.
                   // Assuming we keep schema as UUID, we'd need to generate UUIDs.
                   // FOR DEMO PURPOSE: I will assume the DB schema was adjusted to text or we use a mapping.
      email: `${user.name.toLowerCase().replace(' ', '.')}@example.com`,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar,
      team_id: user.teamId,
      rbac_role: user.rbacRole,
      manager_id: user.managerId
    })
    if (error) console.error('Error user:', error)
  }

  // 2. Teams
  console.log('Creating teams...')
  for (const team of teams) {
    const { error } = await supabase.from('teams').upsert({
      id: team.id,
      name: team.name,
      parent_team_id: team.parentTeamId,
      manager_id: team.managerId
    })
    if (error) console.error('Error team:', error)
  }
  
  // ... (Similar logic for other tables)
  // This is a template. Real seeding requires careful order of operations and ID management.
  
  console.log('✅ Seed complete (partial implementation)')
}

seed()
