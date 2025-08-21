import { getSupabaseServer } from '@/lib/supabase-server'

// POST /api/storage/upload
// form-data: file (Blob), productId (string, optional), type (string, default 'images')
export async function POST(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    // Validate vendor session from cookie
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const applicationAuth = cookieStore.get('vendor_application_auth')?.value

    const supabase = getSupabaseServer()

    let userId = null
    let vendorId = null

    if (sessionToken) {
      // Validate database-backed session
      const { data: sessionData } = await supabase
        .from('vendor_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!sessionData) {
        return Response.json({ success: false, error: 'Invalid session' }, { status: 401 })
      }

      userId = sessionData.user_id
      vendorId = sessionData.vendor_id

      // If vendorId missing, fetch vendor by user
      if (!vendorId) {
        const { data: v } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', userId)
          .single()
        vendorId = v?.id || null
      }
    } else if (applicationAuth) {
      // Fallback for applicants (rare during edit flow)
      try {
        const authData = JSON.parse(applicationAuth)
        if (new Date(authData.expiresAt) < new Date()) {
          return Response.json({ success: false, error: 'Session expired' }, { status: 401 })
        }
        userId = authData.userId
        const { data: v } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', userId)
          .single()
        vendorId = v?.id || null
      } catch {}
    }

    if (!userId || !vendorId) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Parse multipart form data
    const form = await request.formData()
    const file = form.get('file')
    const productId = form.get('productId') || null
    const type = form.get('type') || 'images'

    if (!file || typeof file === 'string') {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const isVideo = (file.type || '').startsWith('video/')
    const extension = (file.name || 'upload').split('.').pop().toLowerCase()
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2,10)}.${extension}`
    const path = productId
      ? `vendors/${vendorId}/products/${productId}/${type}/${fileName}`
      : `vendors/${vendorId}/temp/${type}/${fileName}`

    const bucket = isVideo ? 'product-videos' : 'products'

    // Upload using service role (bypasses storage RLS)
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return Response.json({ success: false, error: uploadError.message }, { status: 400 })
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

    return Response.json({ success: true, url: publicUrl, path })
  } catch (error) {
    console.error('❌ Storage upload API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


