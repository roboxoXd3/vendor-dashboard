import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔄 Testing auth for:', email)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔧 API Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
    
    const startTime = Date.now()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    const endTime = Date.now()
    
    console.log(`⏱️ Auth took ${endTime - startTime}ms`)
    
    if (error) {
      console.error('❌ Auth error:', error)
      return Response.json({ 
        success: false, 
        error: error.message,
        duration: endTime - startTime
      }, { status: 400 })
    }
    
    return Response.json({ 
      success: true, 
      user: data.user?.email,
      duration: endTime - startTime
    })
    
  } catch (error) {
    console.error('❌ API error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}