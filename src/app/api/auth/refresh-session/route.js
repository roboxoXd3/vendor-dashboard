import { NextResponse } from 'next/server'
import { tokenAuthService } from '@/services/tokenAuthService'

export async function POST(request) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Refreshing session token...')

    const result = await tokenAuthService.refreshSession()

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 401 }
      )
    }

    console.log('✅ Session refresh successful')

    return NextResponse.json({
      success: true,
      sessionToken: result.sessionToken
    })

  } catch (error) {
    console.error('❌ Session refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
