# Admin KYC Approval System - Implementation Guide

## 📋 **Overview**

This document provides a complete implementation guide for adding KYC (Know Your Customer) document approval functionality to the admin panel. The vendor-side KYC submission system is already implemented and functional.

## 🎯 **Current Status**

### ✅ **What's Already Implemented**
- **Vendor KYC Submission**: Vendors can upload and submit KYC documents
- **File Storage**: Documents are stored in Supabase Storage
- **Database Schema**: All required fields exist in the `vendors` table
- **API Endpoints**: Vendor-side KYC submission APIs are functional

### ❌ **What Needs Implementation**
- **Admin KYC Review Interface**: UI to view and review KYC submissions
- **Document Viewer**: Interface to view uploaded documents
- **Approval/Rejection Workflow**: Admin actions to approve or reject KYC
- **Admin API Endpoints**: Backend APIs for KYC approval actions

---

## 🗄️ **Database Schema (Already Set Up)**

### **Table**: `vendors`

#### **KYC-Related Fields**:
```sql
-- Text fields for business information
business_registration_number TEXT    -- Business registration number
tax_id TEXT                         -- Tax ID / EIN / GST number
business_type TEXT                  -- Type of business (LLC, Corporation, etc.)

-- JSON field for document storage and status
verification_documents JSONB       -- Stores document URLs and metadata
verification_status TEXT           -- General verification status (verified/unverified)
```

#### **Sample `verification_documents` Structure**:
```json
{
  "id_proof": "https://supabase-url/storage/v1/object/public/documents/vendors/123/kyc/id_proof_123.pdf",
  "business_license": "https://supabase-url/storage/v1/object/public/documents/vendors/123/kyc/license_456.jpg",
  "address_proof": "https://supabase-url/storage/v1/object/public/documents/vendors/123/kyc/address_789.png",
  "submitted_at": "2024-01-15T10:30:00.000Z",
  "status": "under_review",
  "reviewed_at": null,
  "reviewed_by": null,
  "admin_notes": null
}
```

---

## 📁 **File Storage (Already Set Up)**

### **Supabase Storage Buckets**:
- ✅ **`products`** - Product images (existing)
- ✅ **`product-videos`** - Product videos (existing)
- ✅ **`documents`** - KYC documents (**ALREADY CREATED** ✅)

### **Storage Path Structure**:
```
documents/
└── vendors/
    └── {vendorId}/
        └── kyc/
            ├── id_proof_1640995200000_abc123.pdf
            ├── business_license_1640995300000_def456.jpg
            └── address_proof_1640995400000_ghi789.png
```

---

## 🛠️ **Implementation Requirements**

## **1. ✅ Supabase Setup (COMPLETED)**

### **✅ Documents Storage Bucket - ALREADY CREATED**
The `documents` storage bucket has been created with the following configuration:
- **Bucket Name**: `documents`
- **Public Access**: `true`
- **File Size Limit**: `10MB`
- **Allowed Types**: `PDF, JPEG, JPG, PNG, WebP`

### **✅ RLS Policies - ALREADY SET UP**
The following security policies are already in place:
- **View Policy**: Authenticated users can view documents
- **Admin Policy**: Service role has full access for admin operations  
- **Upload Policy**: Vendors can upload their own documents

**No database setup required - everything is ready!**

---

## **2. Backend API Implementation (Copy-Paste Ready)**

### **File**: `adminPanel/app/api/admin/kyc/route.js`

```javascript
import { getSupabaseClient } from '@/lib/supabase-server'

// GET - Fetch KYC submissions for admin review
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'under_review'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10

    const supabase = getSupabaseClient()

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Query vendors with KYC submissions
    let query = supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        business_email,
        business_phone,
        business_address,
        business_type,
        business_registration_number,
        tax_id,
        verification_documents,
        verification_status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .not('verification_documents', 'is', null)

    // Filter by KYC status
    if (status !== 'all') {
      query = query.eq('verification_documents->status', status)
    }

    // Apply pagination and ordering
    const { data: vendors, error, count } = await query
      .order('verification_documents->submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Error fetching KYC submissions:', error)
      return Response.json({ 
        error: 'Failed to fetch KYC submissions' 
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })

  } catch (error) {
    console.error('❌ KYC GET API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Approve or reject KYC submission
export async function POST(request) {
  try {
    const { vendorId, action, adminNotes } = await request.json()

    if (!vendorId || !action) {
      return Response.json({ 
        error: 'Vendor ID and action are required' 
      }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ 
        error: 'Invalid action. Must be: approve or reject' 
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Get current vendor data
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('verification_documents')
      .eq('id', vendorId)
      .single()

    if (fetchError || !vendor) {
      return Response.json({ 
        error: 'Vendor not found' 
      }, { status: 404 })
    }

    // Update verification documents with admin decision
    const updatedDocuments = {
      ...vendor.verification_documents,
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin', // TODO: Get actual admin ID from session
      admin_notes: adminNotes || null
    }

    // Update vendor record
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update({
        verification_documents: updatedDocuments,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating KYC status:', updateError)
      return Response.json({ 
        error: 'Failed to update KYC status' 
      }, { status: 500 })
    }

    console.log(`✅ KYC ${action}d for vendor:`, updatedVendor.business_name)

    return Response.json({
      success: true,
      message: `KYC ${action}d successfully`,
      vendor: updatedVendor
    })

  } catch (error) {
    console.error('❌ KYC approval API error:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
```

---

## **3. Frontend Components**

### **3.1 KYC Review Page**

**File**: `adminPanel/app/(Tabs)/kyc-approvals/page.jsx`

```jsx
"use client"

import { useState, useEffect } from 'react'
import KYCSubmissionCard from './components/KYCSubmissionCard'
import KYCModal from './components/KYCModal'

export default function KYCApprovalsPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [filter, setFilter] = useState('under_review')

  useEffect(() => {
    fetchKYCSubmissions()
  }, [filter])

  const fetchKYCSubmissions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/kyc?status=${filter}`)
      const result = await response.json()
      
      if (result.success) {
        setSubmissions(result.data)
      }
    } catch (error) {
      console.error('Error fetching KYC submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (vendorId, action, notes) => {
    try {
      const response = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, action, adminNotes: notes })
      })

      if (response.ok) {
        // Refresh submissions
        fetchKYCSubmissions()
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Error processing KYC approval:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">KYC Document Review</h1>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {['under_review', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded ${
                filter === status 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((submission) => (
          <KYCSubmissionCard
            key={submission.id}
            submission={submission}
            onView={() => setSelectedSubmission(submission)}
          />
        ))}
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <KYCModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={(notes) => handleApproval(selectedSubmission.id, 'approve', notes)}
          onReject={(notes) => handleApproval(selectedSubmission.id, 'reject', notes)}
        />
      )}
    </div>
  )
}
```

### **3.2 KYC Submission Card Component**

**File**: `adminPanel/app/(Tabs)/kyc-approvals/components/KYCSubmissionCard.jsx`

```jsx
export default function KYCSubmissionCard({ submission, onView }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const documents = submission.verification_documents || {}
  const documentCount = [documents.id_proof, documents.business_license, documents.address_proof]
    .filter(Boolean).length

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{submission.business_name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(documents.status)}`}>
          {documents.status?.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p><strong>Email:</strong> {submission.business_email}</p>
        <p><strong>Business Type:</strong> {submission.business_type}</p>
        <p><strong>Documents:</strong> {documentCount}/3 uploaded</p>
        <p><strong>Submitted:</strong> {new Date(documents.submitted_at).toLocaleDateString()}</p>
      </div>

      <button
        onClick={onView}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Review Documents
      </button>
    </div>
  )
}
```

### **3.3 KYC Review Modal Component**

**File**: `adminPanel/app/(Tabs)/kyc-approvals/components/KYCModal.jsx`

```jsx
import { useState } from 'react'

export default function KYCModal({ submission, onClose, onApprove, onReject }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const documents = submission.verification_documents || {}

  const handleAction = async (action) => {
    setLoading(true)
    try {
      if (action === 'approve') {
        await onApprove(notes)
      } else {
        await onReject(notes)
      }
    } finally {
      setLoading(false)
    }
  }

  const DocumentViewer = ({ title, url, required = false }) => (
    <div className="mb-4">
      <h4 className="font-medium mb-2">
        {title} {required && <span className="text-red-500">*</span>}
      </h4>
      {url ? (
        <div className="border rounded p-4">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Document →
          </a>
        </div>
      ) : (
        <div className="border rounded p-4 text-gray-500">
          Not uploaded
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">KYC Review - {submission.business_name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Business Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Business Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {submission.business_name}</p>
                <p><strong>Email:</strong> {submission.business_email}</p>
                <p><strong>Phone:</strong> {submission.business_phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {submission.business_address}</p>
                <p><strong>Type:</strong> {submission.business_type}</p>
                <p><strong>Registration #:</strong> {submission.business_registration_number || 'Not provided'}</p>
                <p><strong>Tax ID:</strong> {submission.tax_id || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Submission Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Submitted:</strong> {new Date(documents.submitted_at).toLocaleString()}</p>
                <p><strong>Status:</strong> {documents.status}</p>
                {documents.reviewed_at && (
                  <>
                    <p><strong>Reviewed:</strong> {new Date(documents.reviewed_at).toLocaleString()}</p>
                    <p><strong>Reviewed By:</strong> {documents.reviewed_by}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DocumentViewer 
                title="ID Proof" 
                url={documents.id_proof} 
                required 
              />
              <DocumentViewer 
                title="Business License" 
                url={documents.business_license} 
              />
              <DocumentViewer 
                title="Address Proof" 
                url={documents.address_proof} 
              />
            </div>
          </div>

          {/* Admin Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2"
              placeholder="Add notes about this review..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => handleAction('reject')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={() => handleAction('approve')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## **4. Navigation Integration**

### **File**: `adminPanel/app/components/Sidebar.jsx`

Add KYC Approvals to the admin sidebar:

```jsx
// Add this to the navigation items
{
  name: 'KYC Approvals',
  href: '/kyc-approvals',
  icon: DocumentCheckIcon, // or appropriate icon
  current: pathname === '/kyc-approvals'
}
```

---

## **5. Testing & Validation**

### **5.1 Test Data Setup**

Create test KYC submission:
```sql
-- Update a vendor with sample KYC data for testing
UPDATE vendors 
SET verification_documents = '{
  "id_proof": "https://example.com/id.pdf",
  "business_license": "https://example.com/license.jpg", 
  "address_proof": "https://example.com/address.pdf",
  "submitted_at": "2024-01-15T10:30:00.000Z",
  "status": "under_review"
}'
WHERE business_email = 'test@vendor.com';
```

### **5.2 Testing Checklist**

- [ ] Documents bucket created and accessible
- [ ] API endpoints return correct data
- [ ] KYC submissions display in admin panel
- [ ] Document links open correctly
- [ ] Approve/reject actions work
- [ ] Status updates reflect in database
- [ ] Pagination works for large datasets
- [ ] Error handling works properly

---

## **6. Security Considerations**

### **6.1 Authentication**
- Ensure admin authentication before accessing KYC endpoints
- Validate admin permissions for KYC operations

### **6.2 Document Access**
- Implement proper RLS policies for document access
- Ensure only authorized admins can view KYC documents
- Consider document access logging for audit trails

### **6.3 Data Privacy**
- Handle sensitive KYC data according to privacy regulations
- Implement secure document deletion when needed
- Consider data retention policies

---

## **7. Future Enhancements**

### **7.1 Immediate Improvements**
- [ ] Email notifications to vendors on approval/rejection
- [ ] Audit logging for admin actions
- [ ] Bulk approval/rejection functionality
- [ ] Advanced filtering and search

### **7.2 Advanced Features**
- [ ] Document OCR and automatic validation
- [ ] Integration with external KYC services
- [ ] Risk scoring and automated approvals
- [ ] Document expiration tracking

---

## **8. Deployment Notes**

### **8.1 Database Changes**
✅ **COMPLETED** - No database changes needed:
1. ✅ Documents storage bucket created
2. ✅ RLS policies configured  
3. ✅ Document access tested and working

### **8.2 Code Deployment**
1. Deploy API endpoints first
2. Deploy frontend components
3. Update navigation
4. Test end-to-end functionality

### **8.3 Environment Variables**
Ensure these are set in admin panel environment:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## **📞 Support**

If you encounter any issues during implementation:

1. **Database Issues**: Check Supabase logs and RLS policies
2. **API Issues**: Verify service role permissions and error logs
3. **Frontend Issues**: Check browser console for JavaScript errors
4. **Document Access**: Verify storage bucket configuration and policies

**This implementation guide provides everything needed to add complete KYC approval functionality to the admin panel. The vendor-side system is already functional and ready to work with this admin interface.**
