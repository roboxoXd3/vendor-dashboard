import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

/**
 * API endpoint to create auth users and link them to existing vendor records
 * This sets up test vendor accounts with known passwords
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseServer()
    
    // Vendor accounts to create
    const vendorAccounts = [
      {
        vendorId: 'e1d218d0-71c4-4eec-bf9c-50ad4fadf5c2',
        email: 'contact@fashionhub.com',
        password: 'FashionHub123!',
        businessName: 'Fashion Hub'
      },
      {
        vendorId: '95c525a6-f69f-496c-b242-93e94858256a',
        email: 'info@techgadgets.com',
        password: 'TechGadgets123!',
        businessName: 'Tech Gadgets Pro'
      },
      {
        vendorId: '7844626e-67dd-4b6f-9ff8-1ea2bb31839f',
        email: 'hello@homeessentials.com',
        password: 'HomeEssentials123!',
        businessName: 'Home Essentials Co'
      },
      {
        vendorId: 'cf0aee1c-3831-4b20-8ad7-213d9616a066',
        email: 'sales@sportsgear.com',
        password: 'SportsGear123!',
        businessName: 'Sports Gear Store'
      },
      {
        vendorId: '650032bc-a2a8-4478-849d-3fcffc74c685',
        email: 'support@beautycare.com',
        password: 'BeautyCare123!',
        businessName: 'Beauty & Care'
      }
    ]

    const results = []

    for (const account of vendorAccounts) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === account.email)

        let userId

        if (existingUser) {
          console.log(`ℹ️ User already exists for ${account.email}, using existing user`)
          userId = existingUser.id
        } else {
          // Create new auth user using Admin API
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              business_name: account.businessName,
              role: 'vendor'
            }
          })

          if (createError) {
            console.error(`❌ Error creating user for ${account.email}:`, createError)
            results.push({
              vendor: account.businessName,
              email: account.email,
              success: false,
              error: createError.message
            })
            continue
          }

          userId = newUser.user.id
          console.log(`✅ Created auth user for ${account.email}`)
        }

        // Link user to vendor
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ user_id: userId })
          .eq('id', account.vendorId)

        if (updateError) {
          console.error(`❌ Error linking user to vendor ${account.businessName}:`, updateError)
          results.push({
            vendor: account.businessName,
            email: account.email,
            success: false,
            error: updateError.message
          })
          continue
        }

        results.push({
          vendor: account.businessName,
          email: account.email,
          password: account.password,
          vendorId: account.vendorId,
          userId: userId,
          success: true
        })

        console.log(`✅ Successfully set up account for ${account.businessName}`)

      } catch (error) {
        console.error(`❌ Error processing ${account.businessName}:`, error)
        results.push({
          vendor: account.businessName,
          email: account.email,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor accounts setup completed',
      results: results
    })

  } catch (error) {
    console.error('❌ Error setting up vendor accounts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve vendor account information
export async function GET(request) {
  try {
    const supabase = getSupabaseServer()
    
    // Get all vendors
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, business_name, business_email, user_id, status, verification_status')
      .order('created_at')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Get user emails for vendors that have user_id
    const vendorsWithUsers = vendors.filter(v => v.user_id)
    const userIds = vendorsWithUsers.map(v => v.user_id)

    const userEmails = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers()
      if (users?.users) {
        users.users.forEach(user => {
          if (userIds.includes(user.id)) {
            userEmails[user.id] = user.email
          }
        })
      }
    }

    // Map vendor info
    const vendorInfo = vendors.map(vendor => ({
      vendorId: vendor.id,
      businessName: vendor.business_name,
      email: vendor.business_email,
      userId: vendor.user_id,
      userEmail: vendor.user_id ? userEmails[vendor.user_id] : null,
      status: vendor.status,
      verificationStatus: vendor.verification_status,
      hasAccount: !!vendor.user_id
    }))

    return NextResponse.json({
      vendors: vendorInfo,
      totalVendors: vendors.length,
      vendorsWithAccounts: vendorsWithUsers.length
    })

  } catch (error) {
    console.error('❌ Error fetching vendor accounts:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

