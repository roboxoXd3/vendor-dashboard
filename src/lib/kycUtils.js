// KYC Document Management Utilities
// Shared utilities for handling KYC documents across vendor dashboard

export const KYC_DOC_TYPES = {
  ID_PROOF: 'id_proof',
  BUSINESS_LICENSE: 'business_license',
  ADDRESS_PROOF: 'address_proof'
}

export const KYC_STATUS = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  RESUBMISSION_REQUESTED: 'resubmission_requested'
}

/**
 * Count the number of uploaded documents
 * @param {Object} verificationDocs - The verification_documents object from database
 * @returns {number} Count of documents with URLs
 */
export function countUploadedDocs(verificationDocs) {
  if (!verificationDocs) return 0
  return Object.values(KYC_DOC_TYPES).filter(
    type => verificationDocs[type]?.url
  ).length
}

/**
 * Determine the overall KYC status based on document state
 * @param {Object} verificationDocs - The verification_documents object from database
 * @returns {string} Overall status (pending, draft, under_review, verified, rejected)
 */
export function getOverallKycStatus(verificationDocs) {
  if (!verificationDocs) return 'pending'
  
  const hasAnyDoc = countUploadedDocs(verificationDocs) > 0
  if (!hasAnyDoc) return 'pending'
  
  // If documents have been submitted for review
  if (verificationDocs.submitted_at) {
    return verificationDocs.status || KYC_STATUS.UNDER_REVIEW
  }
  
  // Documents uploaded but not submitted
  return KYC_STATUS.DRAFT
}

/**
 * Update status of all uploaded documents
 * @param {Object} verificationDocs - The verification_documents object from database
 * @param {string} newStatus - New status to apply to all documents
 * @returns {Object} Updated verification_documents object
 */
export function updateAllDocStatuses(verificationDocs, newStatus) {
  const updated = { ...verificationDocs }
  
  Object.values(KYC_DOC_TYPES).forEach(type => {
    if (updated[type]?.url) {
      updated[type] = { ...updated[type], status: newStatus }
    }
  })
  
  return updated
}

/**
 * Transform database documents to component state format
 * @param {Object} verificationDocs - The verification_documents object from database
 * @returns {Object} Transformed documents for component state
 */
export function transformDocsForComponent(verificationDocs) {
  if (!verificationDocs) return {}
  
  const transformed = {}
  
  Object.values(KYC_DOC_TYPES).forEach(type => {
    if (verificationDocs[type]?.url) {
      transformed[type] = {
        url: verificationDocs[type].url,
        path: verificationDocs[type].path,
        uploaded: true,
        fromDatabase: true
      }
    }
  })
  
  return transformed
}

