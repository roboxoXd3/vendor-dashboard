import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const supabase = getSupabaseServer()
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        error: 'Authorization header required' 
      }, { status: 401 })
    }

    // Get the token and verify it with Supabase
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return Response.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    console.log('📝 Processing vendor application for user:', user.email)

    // Check if user already has a vendor application
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing vendor:', checkError)
      return Response.json({ 
        error: 'Database error while checking existing application' 
      }, { status: 500 })
    }

    if (existingVendor) {
      return Response.json({ 
        error: `You already have a vendor application with status: ${existingVendor.status}` 
      }, { status: 400 })
    }

    // Prepare vendor data
    const vendorData = {
      user_id: user.id,
      business_name: body.businessName,
      business_description: body.businessDescription,
      business_email: body.businessEmail,
      business_phone: body.businessPhone || null,
      business_address: body.businessAddress,
      business_type: body.businessType,
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
      payment_method_preference: body.paymentMethodPreference,
      bank_account_info: body.paymentMethodPreference === 'bank_transfer' ? body.bankAccountInfo : null,
      is_active: false, // Will be activated upon approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Creating vendor application:', {
      business_name: vendorData.business_name,
      business_email: vendorData.business_email,
      business_type: vendorData.business_type
    })

    // Insert vendor application
    const { data: newVendor, error: insertError } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating vendor application:', insertError)
      return Response.json({ 
        error: 'Failed to submit application. Please try again.' 
      }, { status: 500 })
    }

    console.log('✅ Vendor application created successfully:', newVendor.id)

    // TODO: Send notification to admins about new vendor application
    // TODO: Send confirmation email to vendor

    return Response.json({
      success: true,
      message: 'Vendor application submitted successfully',
      vendor: {
        id: newVendor.id,
        business_name: newVendor.business_name,
        status: newVendor.status,
        created_at: newVendor.created_at
      }
    })

  } catch (error) {
    console.error('❌ Vendor application API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get vendor application status
export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        error: 'Authorization header required' 
      }, { status: 401 })
    }

    // Get the token and verify it with Supabase
    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed in GET:', authError)
      return Response.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, status, verification_status, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (vendorError && vendorError.code !== 'PGRST116') {
      return Response.json({ 
        error: 'Database error' 
      }, { status: 500 })
    }

    if (!vendor) {
      return Response.json({ 
        hasApplication: false 
      })
    }

    return Response.json({
      hasApplication: true,
      vendor: {
        id: vendor.id,
        business_name: vendor.business_name,
        status: vendor.status,
        verification_status: vendor.verification_status,
        created_at: vendor.created_at,
        updated_at: vendor.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Get vendor application error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}