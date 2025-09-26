import { getSupabaseServer } from '@/lib/supabase-server'

// GET /api/bank-accounts - Fetch vendor bank accounts
export async function GET(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    console.log('🏦 Fetching vendor bank accounts...')
    
    if (!sessionToken) {
      console.log('❌ No session token found')
      return Response.json({ 
        error: 'Authentication required - please login first' 
      }, { status: 401 })
    }

    // Find active session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (sessionError || !sessionData) {
      console.log('❌ Invalid or expired session')
      return Response.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Get user ID from session
    const userId = sessionData.user_id
    console.log('✅ Valid session found for user:', userId)

    // Get vendor data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (vendorError || !vendor) {
      console.log('❌ Vendor not found')
      return Response.json({ 
        error: 'Vendor not found' 
      }, { status: 404 })
    }

    // Get vendor bank accounts
    const { data: bankAccounts, error: bankAccountsError } = await supabase
      .from('vendor_bank_accounts')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })

    if (bankAccountsError) {
      console.error('❌ Error fetching bank accounts:', bankAccountsError)
      return Response.json({ 
        error: 'Failed to fetch bank accounts' 
      }, { status: 500 })
    }

    console.log('✅ Bank accounts fetched:', bankAccounts?.length || 0)

    return Response.json({
      success: true,
      data: bankAccounts || []
    })

  } catch (error) {
    console.error('❌ Bank accounts API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/bank-accounts - Add new bank account
export async function POST(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()
    const body = await request.json()

    console.log('🏦 Adding new bank account...')
    
    if (!sessionToken) {
      console.log('❌ No session token found')
      return Response.json({ 
        error: 'Authentication required - please login first' 
      }, { status: 401 })
    }

    // Validate required fields
    const { bank_code, account_number, account_name, bank_name } = body
    if (!bank_code || !account_number || !account_name || !bank_name) {
      return Response.json({ 
        error: 'Bank code, account number, account name, and bank name are required' 
      }, { status: 400 })
    }

    // Find active session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (sessionError || !sessionData) {
      console.log('❌ Invalid or expired session')
      return Response.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Get user ID from session
    const userId = sessionData.user_id
    console.log('✅ Valid session found for user:', userId)

    // Get vendor data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (vendorError || !vendor) {
      console.log('❌ Vendor not found')
      return Response.json({ 
        error: 'Vendor not found' 
      }, { status: 404 })
    }

    // Check if this is the first bank account (make it default)
    const { data: existingAccounts, error: countError } = await supabase
      .from('vendor_bank_accounts')
      .select('id')
      .eq('vendor_id', vendor.id)

    const isFirstAccount = !existingAccounts || existingAccounts.length === 0

    // If making this default, update other accounts
    if (isFirstAccount || body.is_default) {
      await supabase
        .from('vendor_bank_accounts')
        .update({ is_default: false })
        .eq('vendor_id', vendor.id)
    }

    // Insert new bank account
    const { data: newBankAccount, error: insertError } = await supabase
      .from('vendor_bank_accounts')
      .insert({
        vendor_id: vendor.id,
        bank_code: bank_code,
        account_number: account_number,
        account_name: account_name,
        bank_name: bank_name,
        is_verified: false, // Admin needs to verify
        is_default: isFirstAccount || body.is_default || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error adding bank account:', insertError)
      return Response.json({ 
        error: 'Failed to add bank account' 
      }, { status: 500 })
    }

    console.log('✅ Bank account added successfully:', newBankAccount.id)

    return Response.json({
      success: true,
      message: 'Bank account added successfully. It will be verified by admin.',
      data: newBankAccount
    })

  } catch (error) {
    console.error('❌ Add bank account API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
