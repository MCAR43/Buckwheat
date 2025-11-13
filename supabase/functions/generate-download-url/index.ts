import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const { uploadId } = await req.json()

    // Verify user owns this upload
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single()

    if (error || !upload) {
      return new Response(JSON.stringify({ error: 'Not found or unauthorized' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Generate signed download URL
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

    const command = new GetObjectCommand({
      Bucket: Deno.env.get('B2_BUCKET_NAME_UPLOADS')!,
      Key: upload.b2_file_name,
    })

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 })

    return new Response(JSON.stringify({ downloadUrl, upload }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('Error in generate-download-url:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})

