import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!supabaseUrl || !anonKey || !botToken) return json({ error: 'server_not_configured' }, 503)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: authData, error: authError } = await userClient.auth.getUser()
  if (authError || !authData.user) return json({ error: 'unauthorized' }, 401)

  const fileId = new URL(request.url).searchParams.get('id')
  if (!fileId) return json({ error: 'missing_id' }, 400)

  // Prevent an authenticated user from proxying a Telegram file belonging to
  // another organization or to a project hidden by RLS.
  const [{ data: project }, { data: program }] = await Promise.all([
    userClient.from('projects').select('id').eq('image_file_id', fileId).limit(1).maybeSingle(),
    userClient.from('programs').select('id').eq('image_file_id', fileId).limit(1).maybeSingle(),
  ])
  if (!project && !program) return json({ error: 'forbidden' }, 403)

  const getFileResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
  )
  const getFileResult = await getFileResponse.json()
  if (!getFileResponse.ok || !getFileResult.ok) {
    return json({ error: 'telegram_file_not_found', detail: getFileResult }, 502)
  }

  const filePath = getFileResult.result?.file_path
  if (!filePath) return json({ error: 'telegram_missing_file_path' }, 502)

  const fileResponse = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`)
  if (!fileResponse.ok || !fileResponse.body) return json({ error: 'telegram_download_failed' }, 502)

  return new Response(fileResponse.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': fileResponse.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
})
