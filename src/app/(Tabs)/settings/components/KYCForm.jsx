"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UploadKYCDocumentsSection from "./UploadKYCDocumentsSection";
import BusinessInformationSection from "./BusinessInformationSection";

export default function KYCForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [kycStatus, setKycStatus] = useState("pending");
  const [lastUpdated, setLastUpdated] = useState("");

  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    businessRegistrationNumber: "",
    taxId: "",
    countryOfOperation: ""
  });

  const [documents, setDocuments] = useState({
    id_proof: null,
    business_license: null,
    address_proof: null
  });

  // Fetch KYC data on component mount
  useEffect(() => {
    const fetchKYCData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/vendor-kyc', {
          method: 'GET',
          credentials: 'include',
        });

        const result = await response.json();

        if (response.ok && result.kyc) {
          const kyc = result.kyc;
          setFormData({
            businessName: kyc.business_name || "",
            businessType: kyc.business_type || "",
            businessRegistrationNumber: kyc.business_registration_number || "",
            taxId: kyc.tax_id || "",
            countryOfOperation: kyc.country_of_operation || ""
          });
          
          setKycStatus(kyc.status || "pending");
          
          if (kyc.documents?.submitted_at) {
            setLastUpdated(new Date(kyc.documents.submitted_at).toLocaleDateString());
          }
        }
      } catch (err) {
        console.error('Error fetching KYC data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKYCData();
  }, [user]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = async (field, file) => {
    if (!file) return;

    setDocuments(prev => ({ ...prev, [field]: { ...prev[field], uploading: true } }));

    try {
      // Upload file to storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', field);

      const response = await fetch('/api/storage/kyc-upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDocuments(prev => ({ 
          ...prev, 
          [field]: { 
            file: file,
            url: result.url,
            path: result.path,
            uploading: false,
            uploaded: true
          } 
        }));
        console.log(`✅ ${field} uploaded successfully:`, result.url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error(`❌ Error uploading ${field}:`, error);
      setError(`Failed to upload ${field.replace('_', ' ')}: ${error.message}`);
      setDocuments(prev => ({ 
        ...prev, 
        [field]: { ...prev[field], uploading: false, uploaded: false } 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      // TODO: Handle file uploads to storage first
      // For now, we'll just submit the form data
      
      const submitData = {
        businessRegistrationNumber: formData.businessRegistrationNumber,
        taxId: formData.taxId,
        businessType: formData.businessType,
        documents: {
          idProof: documents.id_proof?.url || null,
          businessLicense: documents.business_license?.url || null,
          addressProof: documents.address_proof?.url || null
        }
      };

      const response = await fetch('/api/vendor-kyc', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("🎉 KYC documents submitted successfully! Our team will review them within 2-3 business days.");
        setKycStatus("under_review");
        setLastUpdated(new Date().toLocaleDateString());
      } else {
        setError(result.error || "Failed to submit KYC documents");
      }
    } catch (err) {
      console.error('Error submitting KYC:', err);
      setError("Failed to submit KYC documents. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    switch (kycStatus) {
      case "under_review":
        return {
          text: "🟡 Under Review",
          color: "bg-yellow-100 text-yellow-800",
          message: "Your documents are being reviewed by our compliance team. This typically takes 2–3 business days."
        };
      case "approved":
        return {
          text: "🟢 Verified",
          color: "bg-green-100 text-green-800",
          message: "Your KYC verification is complete. All marketplace features are now available."
        };
      case "rejected":
        return {
          text: "🔴 Rejected",
          color: "bg-red-100 text-red-800",
          message: "Your KYC documents were rejected. Please resubmit with correct information."
        };
      default:
        return {
          text: "🟡 Pending Review",
          color: "bg-yellow-100 text-yellow-800",
          message: "Please complete and submit your KYC documents for verification."
        };
    }
  };

  const statusInfo = getStatusDisplay();

  if (loading) {
    return (
      <div className="max-w-screen mx-auto bg-white shadow-md p-4 md:p-6 rounded-lg">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading KYC information...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-screen mx-auto bg-white shadow-md p-4 md:p-6 rounded-lg space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="border-b border-gray-300 pb-4">
        {/* KYC Heading */}
        <div className="flex justify-between flex-wrap mb-6 gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              Business Verification & KYC
            </h1>
            <p className="text-sm text-gray-500">
              Complete your business verification to enable full marketplace features
            </p>
          </div>
          <div>
            <p className={`py-2 px-3 rounded-3xl text-sm font-bold ${statusInfo.color}`}>
              {statusInfo.text}
            </p>
          </div>
        </div>

        {/* KYC Alert */}
        <div className={`mb-6 border px-4 py-3 rounded ${
          kycStatus === 'approved' 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : kycStatus === 'rejected'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-yellow-200 bg-yellow-50 text-yellow-800'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <strong className="text-sm">{statusInfo.text}</strong>
              <p className="text-sm mt-1 px-6">
                {statusInfo.message}
              </p>
              {lastUpdated && (
                <p className="text-xs mt-2 px-6 opacity-75">
                  Last updated: {lastUpdated}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BusinessInformationSection 
            formData={formData}
            onChange={handleFormChange}
            disabled={kycStatus === 'approved'}
          />
          <UploadKYCDocumentsSection 
            documents={documents}
            onChange={handleDocumentChange}
            disabled={kycStatus === 'approved'}
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={submitting || kycStatus === 'approved'}
        className={`text-white px-6 py-2 rounded text-sm mx-auto block ${
          submitting || kycStatus === 'approved'
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-[var(--color-theme)] hover:opacity-90 cursor-pointer'
        }`}
      >
        {submitting ? 'Submitting...' : kycStatus === 'approved' ? 'Verified ✓' : 'Submit for Review'}
      </button>
    </form>
  );
}
