import { NextResponse } from 'next/server'
import { tokenAuthService } from '@/services/tokenAuthService'

export async function POST(request) {
  try {
    const { sessionToken } = await request.json()

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Validating session token...')

    const validation = await tokenAuthService.validateSession(sessionToken)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    console.log('✅ Session validation successful for:', validation.vendor.business_name)

    return NextResponse.json({
      valid: true,
      user: validation.user,
      vendor: validation.vendor,
      session: validation.session
    })

  } catch (error) {
    console.error('❌ Session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const sessionToken = authHeader.replace('Bearer ', '')
    const validation = await tokenAuthService.validateSession(sessionToken)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: validation.user,
      vendor: validation.vendor
    })

  } catch (error) {
    console.error('❌ Session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
