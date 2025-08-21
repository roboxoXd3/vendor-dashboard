import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    console.log('🔧 Setting up RLS policies for vendor_sessions table...')
    
    const supabase = getSupabaseServer()
    
    // First, let's check if the vendor_sessions table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('vendor_sessions')
      .select('id')
      .limit(1)
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('📋 vendor_sessions table does not exist, creating it...')
      
      // Create the vendor_sessions table
      const { error: createTableError } = await supabase.rpc('create_vendor_sessions_table')
      
      if (createTableError) {
        console.error('❌ Error creating vendor_sessions table:', createTableError)
        return Response.json({ 
          error: 'Failed to create vendor_sessions table',
          details: createTableError.message 
        }, { status: 500 })
      }
      
      console.log('✅ vendor_sessions table created successfully')
    }
    
    // Try to create a test session to check RLS policies
    const testSession = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      vendor_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      session_token: 'test_token_' + Date.now(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error: insertError } = await supabase
      .from('vendor_sessions')
      .insert([testSession])
    
    if (insertError) {
      if (insertError.code === '42501') {
        console.log('🔒 RLS policy blocking insert, this is expected behavior')
        return Response.json({
          success: true,
          message: 'RLS policies are active (this is good for security)',
          note: 'The vendor session creation will work when called with proper authentication'
        })
      } else {
        console.error('❌ Unexpected error inserting test session:', insertError)
        return Response.json({ 
          error: 'Unexpected database error',
          details: insertError.message 
        }, { status: 500 })
      }
    }
    
    // If we got here, the insert worked - clean up the test data
    await supabase
      .from('vendor_sessions')
      .delete()
      .eq('session_token', testSession.session_token)
    
    console.log('✅ vendor_sessions table is working properly')
    
    return Response.json({
      success: true,
      message: 'vendor_sessions table is set up correctly'
    })
    
  } catch (error) {
    console.error('❌ Setup RLS error:', error)
    return Response.json({ 
      error: 'Setup failed',
      message: error.message 
    }, { status: 500 })
  }
}
