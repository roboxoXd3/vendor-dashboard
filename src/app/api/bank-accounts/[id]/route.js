import { getSupabaseServer } from '@/lib/supabase-server'

// PUT /api/bank-accounts/[id] - Update bank account (make default)
export async function PUT(request, { params }) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { id } = params

    console.log('🏦 Updating bank account:', id)
    
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

    // Verify the bank account belongs to this vendor
    const { data: bankAccount, error: bankAccountError } = await supabase
      .from('vendor_bank_accounts')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single()

    if (bankAccountError || !bankAccount) {
      console.log('❌ Bank account not found or not owned by vendor')
      return Response.json({ 
        error: 'Bank account not found' 
      }, { status: 404 })
    }

    // If making this default, update other accounts to not be default
    if (body.is_default) {
      await supabase
        .from('vendor_bank_accounts')
        .update({ is_default: false })
        .eq('vendor_id', vendor.id)
        .neq('id', id)
    }

    // Update the bank account
    const { data: updatedBankAccount, error: updateError } = await supabase
      .from('vendor_bank_accounts')
      .update({
        is_default: body.is_default || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating bank account:', updateError)
      return Response.json({ 
        error: 'Failed to update bank account' 
      }, { status: 500 })
    }

    console.log('✅ Bank account updated successfully:', updatedBankAccount.id)

    return Response.json({
      success: true,
      message: 'Bank account updated successfully',
      data: updatedBankAccount
    })

  } catch (error) {
    console.error('❌ Update bank account API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
