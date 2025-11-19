import { getSupabaseClient } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    const { vendorId, action, notes } = await request.json()
    const supabase = getSupabaseClient()
    
    if (!vendorId || !action) {
      return Response.json({ 
        error: 'Vendor ID and action are required' 
      }, { status: 400 })
    }

    if (!['approve', 'reject', 'pending'].includes(action)) {
      return Response.json({ 
        error: 'Invalid action. Must be: approve, reject, or pending' 
      }, { status: 400 })
    }

    console.log(`🔄 ${action}ing vendor:`, vendorId)

    // Update vendor status
    const updateData = {
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending',
      is_active: action === 'approve',
      updated_at: new Date().toISOString(),
      admin_notes: action === 'reject' ? (notes || null) : null,
      rejection_reason: action === 'reject' ? (notes || null) : null
    }

    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendorId)
      .select('id, business_name, business_email, status, user_id')
      .single()

    if (updateError) {
      console.error('❌ Error updating vendor status:', updateError)
      return Response.json({ 
        error: 'Failed to update vendor status' 
      }, { status: 500 })
    }

    console.log(`✅ Vendor ${action}d successfully:`, updatedVendor.business_name)

    // TODO: Send email notification to vendor about status change
    // TODO: Log admin action for audit trail

    return Response.json({
      success: true,
      message: `Vendor ${action}d successfully`,
      vendor: updatedVendor
    })

  } catch (error) {
    console.error('❌ Admin approve vendor API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get all pending vendor applications (for admin use)
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const { data: pendingVendors, error } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        business_email,
        business_description,
        business_type,
        status,
        verification_status,
        created_at,
        updated_at
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching pending vendors:', error)
      return Response.json({ 
        error: 'Failed to fetch pending applications' 
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      pendingVendors: pendingVendors || []
    })

  } catch (error) {
    console.error('❌ Get pending vendors API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}