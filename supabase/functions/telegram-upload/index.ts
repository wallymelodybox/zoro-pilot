import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_BYTES = 19 * 1024 * 1024
const ENTITY_TABLES: Record<string, string> = {
  project: 'projects',
  program: 'programs',
}
const COMMENT_TABLES: Record<string, { table: string; foreignKey: string }> = {
  task_comment: { table: 'task_comments', foreignKey: 'task_comment_id' },
  project_comment: { table: 'project_comments', foreignKey: 'project_comment_id' },
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !botToken || !chatId) {
    return json({ error: 'server_not_configured' }, 503)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: authData, error: authError } = await userClient.auth.getUser()
  if (authError || !authData.user) return json({ error: 'unauthorized' }, 401)

  const form = await request.formData().catch(() => null)
  if (!form) return json({ error: 'invalid_form_data' }, 400)

  const entityType = String(form.get('entityType') ?? '')
  const entityId = String(form.get('entityId') ?? '')
  const file = form.get('file')
  const table = ENTITY_TABLES[entityType]
  const commentTarget = COMMENT_TABLES[entityType]
  if ((!table && !commentTarget) || !entityId || !(file instanceof File)) {
    return json({ error: 'invalid_request' }, 400)
  }
  // Dart's MultipartFile.fromBytes may send application/octet-stream even
  // though ImagePicker produced an image; validate the filename as fallback.
  const imageName = file.name.toLowerCase()
  const hasAllowedExtension = /\.(jpe?g|png|webp|gif|heic|heif|mp4|mov|m4v|webm)$/.test(imageName)
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !hasAllowedExtension) {
    return json({ error: 'invalid_file_type' }, 415)
  }
  if (file.size > MAX_BYTES) return json({ error: 'file_too_large', maxBytes: MAX_BYTES }, 413)

  // This SELECT intentionally uses the caller JWT. Existing RLS decides
  // whether the user may access this project/sub-project/programme.
  const targetTable = table ?? commentTarget!.table
  const { data: entity, error: entityError } = await userClient
    .from(targetTable)
    .select('id,organization_id')
    .eq('id', entityId)
    .maybeSingle()
  if (entityError || !entity) return json({ error: 'forbidden' }, 403)

  const telegramForm = new FormData()
  telegramForm.set('chat_id', chatId)
  telegramForm.set('document', file, file.name || 'image')

  const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: telegramForm,
  })
  const telegramResult = await telegramResponse.json()
  if (!telegramResponse.ok || !telegramResult.ok) {
    return json({ error: 'telegram_upload_failed', detail: telegramResult }, 502)
  }

  const fileId: string | undefined = telegramResult.result?.document?.file_id
  if (!fileId) return json({ error: 'telegram_missing_file_id' }, 502)

  // Only the technical image columns are written with the service role.
  // Authorization was already established above using the caller's RLS.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  if (commentTarget) {
    const mediaType = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/.test(imageName)
      ? 'video'
      : 'image'
    const { data: attachment, error: insertError } = await adminClient
      .from('comment_attachments')
      .insert({
        organization_id: entity.organization_id,
        [commentTarget.foreignKey]: entityId,
        uploader_id: authData.user.id,
        telegram_file_id: fileId,
        media_type: mediaType,
        file_name: file.name || `${mediaType}-${Date.now()}`,
        mime_type: file.type || null,
        byte_size: file.size,
      })
      .select()
      .single()
    if (insertError) return json({ error: 'db_insert_failed', detail: insertError.message }, 500)
    return json({ fileId, attachment })
  }

  const { error: updateError } = await adminClient
    .from(table)
    .update({ image_file_id: fileId, image_url: null })
    .eq('id', entityId)
    .eq('organization_id', entity.organization_id)
  if (updateError) return json({ error: 'db_update_failed', detail: updateError.message }, 500)

  return json({ fileId })
})
