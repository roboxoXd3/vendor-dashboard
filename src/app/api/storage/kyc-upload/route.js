import { getSupabaseServer } from '@/lib/supabase-server'
import { KYC_STATUS } from '@/lib/kycUtils'

// POST /api/storage/kyc-upload
// Handles KYC document uploads (ID proof, business license, address proof)
export async function POST(request) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    // Validate vendor session from cookie
    const sessionToken = cookieStore.get('vendor_session_token')?.value
    const supabase = getSupabaseServer()

    if (!sessionToken) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Validate database-backed session
    const { data: sessionData } = await supabase
      .from('vendor_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!sessionData) {
      return Response.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }

    const userId = sessionData.user_id

    // Get vendor ID
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!vendor) {
      return Response.json({ success: false, error: 'Vendor not found' }, { status: 404 })
    }

    const vendorId = vendor.id

    // Parse multipart form data
    const form = await request.formData()
    const file = form.get('file')
    const documentType = form.get('documentType') // 'id_proof', 'business_license', 'address_proof'

    if (!file || typeof file === 'string') {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!documentType) {
      return Response.json({ success: false, error: 'Document type is required' }, { status: 400 })
    }

    // Validate document type
    const allowedDocTypes = ['id_proof', 'business_license', 'address_proof']
    if (!allowedDocTypes.includes(documentType)) {
      return Response.json({ success: false, error: 'Invalid document type' }, { status: 400 })
    }

    // Validate file type (documents only)
    const allowedFileTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg', 
      'image/png',
      'image/webp'
    ]
    
    if (!allowedFileTypes.includes(file.type)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid file type. Please upload PDF, JPEG, PNG, or WebP files only.' 
      }, { status: 400 })
    }

    // Check file size (max 10MB for documents)
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxFileSize) {
      return Response.json({ 
        success: false, 
        error: 'File size too large. Please upload files smaller than 10MB.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop().toLowerCase()
    const fileName = `${documentType}_${timestamp}_${randomString}.${fileExtension}`

    // Create storage path for KYC documents
    const storagePath = `vendors/${vendorId}/kyc/${fileName}`

    console.log('📤 Uploading KYC document:', {
      documentType,
      fileName,
      storagePath,
      fileSize: file.size,
      fileType: file.type
    })

    // Upload to 'documents' bucket (create if doesn't exist)
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return Response.json({ success: false, error: uploadError.message }, { status: 400 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath)

    console.log('✅ KYC document uploaded to storage:', publicUrl)

    // Save to database immediately with draft status
    try {
      // Fetch current verification_documents
      const { data: currentVendor } = await supabase
        .from('vendors')
        .select('verification_documents')
        .eq('user_id', userId)
        .single()

      let verificationDocs = currentVendor?.verification_documents || {}

      // Delete old file from storage if replacing existing document
      if (verificationDocs[documentType]?.path) {
        const oldPath = verificationDocs[documentType].path
        await supabase.storage
          .from('documents')
          .remove([oldPath])
        console.log(`🗑️ Replaced old ${documentType}:`, oldPath)
      }

      // Update verification_documents with new upload
      verificationDocs[documentType] = {
        url: publicUrl,
        path: storagePath,
        type: file.type,
        status: KYC_STATUS.DRAFT,
        uploaded_at: new Date().toISOString()
      }

      // Save to database
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ 
          verification_documents: verificationDocs,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('⚠️ Failed to save document to database:', updateError)
        // Don't fail the request, file is already uploaded to storage
      } else {
        console.log('✅ Document saved to database with draft status')
      }
    } catch (dbError) {
      console.error('⚠️ Database save error:', dbError)
      // Continue - file is uploaded to storage successfully
    }

    return Response.json({ 
      success: true, 
      url: publicUrl, 
      path: storagePath,
      documentType: documentType
    })

  } catch (error) {
    console.error('❌ KYC upload API error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
