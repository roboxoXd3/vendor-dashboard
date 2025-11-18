import { getSupabaseServer } from '@/lib/supabase-server'
import { countUploadedDocs, getOverallKycStatus, updateAllDocStatuses, KYC_STATUS } from '@/lib/kycUtils'

// GET KYC documents and status
export async function GET(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    if (!sessionToken) {
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
      .single()

    if (sessionError || !sessionData) {
      return Response.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return Response.json({ 
        error: 'Session expired - please login again' 
      }, { status: 401 })
    }

    const userId = sessionData.user_id

    // Fetch vendor KYC information
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('verification_documents, business_registration_number, tax_id, business_type')
      .eq('user_id', userId)
      .single()

    if (vendorError) {
      console.error('❌ Error fetching vendor KYC info:', vendorError)
      return Response.json({ 
        error: 'Failed to fetch KYC information' 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true,
      kyc: {
        documents: vendor.verification_documents || {},
        business_registration_number: vendor.business_registration_number,
        tax_id: vendor.tax_id,
        business_type: vendor.business_type,
        status: getOverallKycStatus(vendor.verification_documents),
        uploadedCount: countUploadedDocs(vendor.verification_documents)
      }
    })

  } catch (error) {
    console.error('❌ KYC GET error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// SUBMIT KYC documents and information
export async function POST(request) {
  try {
    const body = await request.json()
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    console.log('🔄 Submitting KYC documents...')

    if (!sessionToken) {
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
      .single()

    if (sessionError || !sessionData) {
      return Response.json({ 
        error: 'Invalid or expired session' 
      }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return Response.json({ 
        error: 'Session expired - please login again' 
      }, { status: 401 })
    }

    const userId = sessionData.user_id

    console.log('💾 Updating vendor KYC status to under_review')

    // Fetch current verification_documents
    const { data: currentVendor } = await supabase
      .from('vendors')
      .select('verification_documents')
      .eq('user_id', userId)
      .single()

    // Update all document statuses to under_review
    let verificationDocs = updateAllDocStatuses(
      currentVendor?.verification_documents || {},
      KYC_STATUS.UNDER_REVIEW
    )

    // Add submission timestamp
    verificationDocs.submitted_at = new Date().toISOString()
    verificationDocs.status = KYC_STATUS.UNDER_REVIEW

    // Prepare KYC data
    const kycData = {
      business_registration_number: body.businessRegistrationNumber || null,
      tax_id: body.taxId || null,
      business_type: body.businessType || null,
      verification_documents: verificationDocs,
      updated_at: new Date().toISOString()
    }

    // Update vendor KYC information
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(kycData)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Error updating KYC information:', updateError)
      return Response.json({ 
        error: 'Failed to submit KYC documents' 
      }, { status: 500 })
    }

    console.log('✅ KYC documents submitted successfully')

    return Response.json({
      success: true,
      message: 'KYC documents submitted successfully for review',
      kyc: {
        status: 'under_review',
        submitted_at: kycData.verification_documents.submitted_at
      }
    })

  } catch (error) {
    console.error('❌ KYC submission error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
