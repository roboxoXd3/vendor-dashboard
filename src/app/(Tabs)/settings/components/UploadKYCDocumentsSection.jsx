import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { FaAddressCard } from "react-icons/fa";
import { MdHome } from "react-icons/md";
import { IoIosBusiness } from "react-icons/io";

export default function UploadKYCDocumentsSection() {
  const [uploads, setUploads] = useState({
    idProof: null,
    license: null,
    address: null,
  });

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setUploads((prev) => ({ ...prev, [field]: file }));
    }
  };

  const handleDelete = (field) => {
    setUploads((prev) => ({ ...prev, [field]: null }));
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
            <label className="block border-2 border-gray-300 border-dotted rounded px-4 py-6 text-center text-sm cursor-pointer hover:bg-gray-50 mt-2">
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "idProof")}
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
            {uploads.idProof && (
              <div className="mt-2 px-3 py-2 rounded flex justify-between items-center text-sm bg-green-50 border border-green-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📎</span>
                  <div>
                    <p className="font-medium">{uploads.idProof.name}</p>
                    <p
                      className={`text-sm font ${"text-[var(--color-theme)]"}`}
                    >
                      Uploaded successfully
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete("idProof")}
                  className="text-red-500 text-xl cursor-pointer"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Business License */}
          <div>
            <label className="block text-sm font-medium">
              Business License/Certificate
            </label>
            <label className="block border-2 border-gray-300 border-dotted rounded px-4 py-6 text-center text-sm cursor-pointer hover:bg-gray-50 mt-2">
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "license")}
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
            {uploads.license && (
              <div className="mt-2 px-3 py-2 rounded flex justify-between items-center text-sm bg-green-50 border border-green-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📎</span>
                  <div>
                    <p className="font-medium">{uploads.license.name}</p>
                    <p
                      className={`text-sm font ${"text-[var(--color-theme)]"}`}
                    >
                      Uploaded successfully
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete("license")}
                  className="text-red-500 text-xl cursor-pointer"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Proof of Address */}
          <div>
            <label className="block text-sm font-medium">
              Proof of Address (Optional)
            </label>
            <label className="block border-2 border-gray-300 border-dotted rounded px-4 py-6 text-center text-sm cursor-pointer hover:bg-gray-50 mt-2">
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "address")}
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
            {uploads.address && (
              <div className="mt-2 px-3 py-2 rounded flex justify-between items-center text-sm bg-green-50 border border-green-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📎</span>
                  <div>
                    <p className="font-medium">{uploads.address.name}</p>
                    <p
                      className={`text-sm font ${"text-[var(--color-theme)]"}`}
                    >
                      Uploaded successfully
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete("address")}
                  className="text-red-500 text-xl cursor-pointer"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
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
