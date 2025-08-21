import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization header required' 
      }, { status: 401 })
    }

    // Get the token and verify it with server-side Supabase
    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    console.log('📝 Creating vendor profile for user:', user.email)

    // Check if user already has a vendor profile
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing vendor:', checkError)
      return NextResponse.json({ 
        error: 'Database error while checking existing profile' 
      }, { status: 500 })
    }

    if (existingVendor) {
      return NextResponse.json({ 
        error: `You already have a vendor profile with status: ${existingVendor.status}` 
      }, { status: 400 })
    }

    // Prepare vendor data with minimal required fields
    const vendorData = {
      user_id: user.id,
      business_name: body.businessName,
      business_description: body.businessDescription || 'No description provided',
      business_email: body.businessEmail || user.email,
      business_phone: body.businessPhone || null,
      business_address: body.businessAddress || 'Address to be updated',
      business_type: body.businessType || 'retail',
      business_registration_number: body.businessRegistrationNumber || null,
      tax_id: body.taxId || null,
      status: 'pending',
      verification_status: 'unverified',
      is_featured: false,
      average_rating: 0,
      total_reviews: 0,
      total_sales: 0,
      total_orders: 0,
      commission_rate: 10.00, // Default 10% commission
      payout_schedule: 'monthly',
      payment_method_preference: body.paymentMethodPreference || 'bank_transfer',
      bank_account_info: body.bankAccountInfo || null,
      is_active: false, // Will be activated upon approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Creating vendor profile:', {
      business_name: vendorData.business_name,
      business_email: vendorData.business_email,
      business_type: vendorData.business_type
    })

    // Insert vendor profile
    const { data: newVendor, error: insertError } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating vendor profile:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create vendor profile. Please try again.' 
      }, { status: 500 })
    }

    console.log('✅ Vendor profile created successfully:', newVendor.id)

    return NextResponse.json({
      success: true,
      message: 'Vendor profile created successfully',
      vendor: {
        id: newVendor.id,
        business_name: newVendor.business_name,
        status: newVendor.status,
        verification_status: newVendor.verification_status,
        created_at: newVendor.created_at
      }
    })

  } catch (error) {
    console.error('❌ Create vendor profile API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
