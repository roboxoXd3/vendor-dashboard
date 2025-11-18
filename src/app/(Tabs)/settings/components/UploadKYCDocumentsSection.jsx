import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { FaAddressCard } from "react-icons/fa";
import { MdHome } from "react-icons/md";
import { IoIosBusiness } from "react-icons/io";

export default function UploadKYCDocumentsSection({ documents, onChange, disabled = false }) {
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file && onChange) {
      onChange(field, file);
    }
  };

  const handleDelete = (field) => {
    if (onChange) {
      onChange(field, null);
    }
  };

  return (
    <div>
      <div>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 bg">
          📁 Document Upload (KYC)
        </h2>

        <div className="space-y-4">
          {/* ID Proof */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ID Proof<span className="text-red-500">*</span>
            </label>
            <label className={`block border-2 border-gray-300 border-dotted rounded px-4 py-6 text-center text-sm mt-2 ${disabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'}`}>
              <input
                type="file"
                className="hidden"
                disabled={disabled}
                onChange={(e) => handleFileUpload(e, "id_proof")}
              />
              <FaAddressCard className="mx-auto" size={25} />
              <p className="text-gray-500">
                Upload passport, driver’s license, or national ID
              </p>
              <p className={`mt-1 font-medium ${"text-[var(--color-theme)]"}`}>
                Choose File
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG up to 5MB
              </p>
            </label>
            {(documents?.id_proof?.file || documents?.id_proof?.uploaded) && (
              <div className="mt-2 px-3 py-2 rounded flex justify-between items-center text-sm bg-green-50 border border-green-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="font-medium">
                      {documents.id_proof.file?.name || 'ID Proof Document'}
                    </p>
                    <p
                      className={`text-sm font ${"text-[var(--color-theme)]"}`}
                    >
                      {documents.id_proof.fromDatabase ? 'Previously uploaded ✓' : 'Uploaded successfully ✓'}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <button
                    onClick={() => handleDelete("id_proof")}
                    className="text-red-500 text-xl cursor-pointer"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Business License */}
          <div>
            <label className="block text-sm font-medium">
              Business License/Certificate
            </label>
            <label className={`block border-2 border-gray-300 border-dotted rounded px-4 py-6 text-center text-sm mt-2 ${disabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'}`}>
              <input
                type="file"
                className="hidden"
                disabled={disabled}
                onChange={(e) => handleFileUpload(e, "business_license")}
              />
              <IoIosBusiness className="mx-auto" size={25} />
              <p className="text-gray-500">
                Upload business registration certificate
              </p>
              <p className={`mt-1 font-medium ${"text-[var(--color-theme)]"}`}>
                Choose File
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG up to 5MB
              </p>
            </label>
            {(documents?.business_license?.file || documents?.business_license?.uploaded) && (
              <div className="mt-2 px-3 py-2 rounded flex justify-between items-center text-sm bg-green-50 border border-green-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="font-medium">
                      {documents.business_license.file?.name || 'Business License Document'}
                    </p>
                    <p
                      className={`text-sm font ${"text-[var(--color-theme)]"}`}
                    >
                      {documents.business_license.fromDatabase ? 'Previously uploaded ✓' : 'Uploaded successfully ✓'}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <button
                    onClick={() => handleDelete("business_license")}
                    className="text-red-500 text-xl cursor-pointer"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Proof of Address */}
          <div>
            <label className="block text-sm font-medium">
              Proof of Address (Optional)
            </label>
            <label className={`block border-2 border-gray-300 border-dotted rounded px-4 py-6 text-center text-sm mt-2 ${disabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'}`}>
              <input
                type="file"
                className="hidden"
                disabled={disabled}
                onChange={(e) => handleFileUpload(e, "address_proof")}
              />
              <MdHome className="mx-auto" size={25} />
              <p className="text-gray-500">
                Upload utility bill or bank statement
              </p>
              <p className={`mt-1 font-medium ${"text-[var(--color-theme)]"}`}>
                Choose File
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG up to 5MB
              </p>
            </label>
            {(documents?.address_proof?.file || documents?.address_proof?.uploaded) && (
              <div className="mt-2 px-3 py-2 rounded flex justify-between items-center text-sm bg-green-50 border border-green-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="font-medium">
                      {documents.address_proof.file?.name || 'Address Proof Document'}
                    </p>
                    <p
                      className={`text-sm font ${"text-[var(--color-theme)]"}`}
                    >
                      {documents.address_proof.fromDatabase ? 'Previously uploaded ✓' : 'Uploaded successfully ✓'}
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <button
                    onClick={() => handleDelete("address_proof")}
                    className="text-red-500 text-xl cursor-pointer"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium">
              Additional Notes
            </label>
            <textarea
              rows={4}
              className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0 resize-none"
              placeholder="Any additional information for the review team..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
