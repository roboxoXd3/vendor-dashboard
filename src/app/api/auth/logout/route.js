import { NextResponse } from 'next/server'
import { tokenAuthService } from '@/services/tokenAuthService'
import { getSupabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    console.log('🚪 Vendor logout initiated...')

    // Invalidate the vendor session
    await tokenAuthService.invalidateSession()

    // Sign out from Supabase
    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Supabase signout error:', error)
    }

    console.log('✅ Vendor logout successful')

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
