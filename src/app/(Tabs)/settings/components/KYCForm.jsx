"use client";
import UploadKYCDocumentsSection from "./UploadKYCDocumentsSection";
import BusinessInformationSection from "./BusinessInformationSection";

export default function KYCForm() {
  return (
    <div className="max-w-screen mx-auto bg-white shadow-md p-4 md:p-6 rounded-lg space-y-6">
      <div className="border-b border-gray-300 pb-4">
        {/* KYC Heading */}
        <div className="flex justify-between flex-wrap mb-6 gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              Business Verification & KYC
            </h1>
            <p className="text-sm text-gray-500">
              Complete your business verification to enable full marketplace
              features
            </p>
          </div>
          <div>
            <p className="py-2 px-3 bg-yellow-100 rounded-3xl text-yellow-800 text-sm font-bold">
              🟡 Pending Review
            </p>
          </div>
        </div>

        {/* KYC Alert */}
        <div className="mb-6 border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 rounded">
          <div className="flex items-start justify-between">
            <div>
              <strong className="text-sm">🟡 Verification In Progress</strong>
              <p className="text-sm mt-1 px-6">
                Your documents are being reviewed by our compliance team. This
                typically takes 2–3 business days.
              </p>
              <p className="text-xs mt-2 px-6 text-yellow-600">
                Last updated: December 15, 2024 at 2:30 PM
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BusinessInformationSection />
          <UploadKYCDocumentsSection />
        </div>
      </div>

      <button className="text-white px-6 py-2 rounded text-sm bg-[var(--color-theme)] mx-auto block">
        Submit for Review
      </button>
    </div>
  );
}
