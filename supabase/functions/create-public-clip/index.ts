import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // Optional: verify user if authenticated
    const authHeader = req.headers.get('Authorization')
    let userId = null
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      userId = user?.id
    }

    const { fileName, fileData, deviceId, metadata } = await req.json()
    
    // Generate share code
    const shareCode = generateShareCode()
    
    // Upload to B2 clips bucket
    const b2Endpoint = Deno.env.get('B2_ENDPOINT')!
    const endpoint = b2Endpoint.startsWith('http') ? b2Endpoint : `https://${b2Endpoint}`
    
    const s3Client = new S3Client({
      region: Deno.env.get('B2_REGION')!,
      endpoint: endpoint,
      credentials: {
        accessKeyId: Deno.env.get('B2_KEY_ID')!,
        secretAccessKey: Deno.env.get('B2_APPLICATION_KEY')!,
      },
    })

    const key = `clips/${shareCode}/${fileName}`
    
    // Decode base64 file data
    const buffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))
    
    await s3Client.send(new PutObjectCommand({
      Bucket: Deno.env.get('B2_BUCKET_NAME_CLIPS')!,
      Key: key,
      Body: buffer,
      ContentType: 'video/mp4',
    }))

    // Create database record
    const { data: clip } = await supabase
      .from('clips')
      .insert({
        user_id: userId,
        device_id: deviceId,
        filename: fileName,
        b2_file_name: key,
        file_size: buffer.length,
        share_code: shareCode,
        metadata,
      })
      .select()
      .single()

    // Return Cloudflare Worker URL (or direct B2 for now)
    const publicUrl = `${Deno.env.get('CLIPS_CDN_URL')}/${shareCode}`

    return new Response(JSON.stringify({ clip, publicUrl, shareCode }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('Error in create-public-clip:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})

