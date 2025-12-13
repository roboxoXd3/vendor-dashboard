import { getSupabaseServer } from '@/lib/supabase-server'

// POST /api/storage/delete
// Delete a file from Supabase Storage
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
      // Fallback for applicants
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

    const { bucket, path } = await request.json()

    if (!bucket || !path) {
      return Response.json({ success: false, error: 'Bucket and path are required' }, { status: 400 })
    }

    // Verify the path belongs to this vendor (security check)
    if (!path.startsWith(`vendors/${vendorId}/`)) {
      return Response.json({ success: false, error: 'Unauthorized: File does not belong to this vendor' }, { status: 403 })
    }

    // Delete the file from storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (deleteError) {
      console.error('❌ Storage delete error:', deleteError)
      return Response.json({ success: false, error: deleteError.message }, { status: 400 })
    }

    console.log('✅ Deleted file from storage:', { bucket, path })
    return Response.json({ success: true, message: 'File deleted successfully' })
  } catch (error) {
    console.error('❌ Storage delete API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

