"use client";

import { useState, useEffect } from "react";
import { FaImage } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

export default function GeneralInfo() {
  const { user } = useAuth();
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    businessType: "",
    registrationNumber: "",
    taxId: "",
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Fetch vendor profile data on component mount
  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/vendor-profile', {
          method: 'GET',
          credentials: 'include',
        });

        const result = await response.json();

        if (response.ok && result.vendor) {
          const vendor = result.vendor;
          setForm({
            storeName: vendor.business_name || "",
            description: vendor.business_description || "",
            email: vendor.business_email || "",
            phone: vendor.business_phone || "",
            address: vendor.business_address || "",
            businessType: vendor.business_type || "",
            registrationNumber: vendor.business_registration_number || "",
            taxId: vendor.tax_id || "",
          });

          // Set logo preview if exists
          if (vendor.business_logo) {
            setPreview(vendor.business_logo);
          }
        } else {
          setError("Failed to load vendor profile");
        }
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        setError("Failed to load vendor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear messages when user starts typing
    if (message || error) {
      setMessage("");
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updateData = {
        business_name: form.storeName,
        business_description: form.description,
        business_phone: form.phone,
        business_address: form.address,
        business_type: form.businessType,
        business_registration_number: form.registrationNumber,
        tax_id: form.taxId,
      };

      // TODO: Handle logo upload separately
      if (logo) {
        // For now, we'll skip logo upload - can be implemented later
        console.log('Logo upload will be implemented later');
      }

      const response = await fetch('/api/vendor-profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "Store information updated successfully!");
        
        if (result.setupComplete) {
          setMessage("🎉 Congratulations! Your vendor setup is now complete and verified. You can now start selling!");
        }
      } else {
        setError(result.error || "Failed to update store information");
      }
    } catch (err) {
      console.error('Error updating vendor profile:', err);
      setError("Failed to update store information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen mx-auto bg-white p-4 md:p-6 rounded-lg shadow space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading vendor information...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-screen mx-auto bg-white p-4 md:p-6 rounded-lg shadow space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
        {/* Store Identity */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Store Identity</h2>

          <div className="flex flex-col items-start gap-2 mb-4">
            <label className="block text-sm font-medium">Store Logo</label>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 border-2 border-gray-300 border-dotted rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img
                    src={preview}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xl">
                    <FaImage />
                  </span>
                )}
              </div>
              <div>
                <label className="inline-block text-white text-[12px] px-3 py-1.5 rounded cursor-pointer bg-[var(--color-theme)]">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-gray-500 mt-1">
                  JPG, PNG up to 2MB
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              placeholder="Store Name"
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1 outline-none focus:ring-0 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Store Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Premium tech accessories and gadgets"
              className="w-full rounded px-3 py-2 mt-1 text-sm resize-none border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium">Store Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled
              className="w-full rounded px-3 py-2 mt-1 bg-gray-100 text-gray-500 cursor-not-allowed outline-none focus:ring-0 border border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contact support to change email
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Store Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full rounded px-3 py-2 mt-1 border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Store Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              placeholder="123 Tech Street, Silicon Valley, CA 94105, United States"
              className="w-full rounded px-3 py-2 mt-1 text-sm resize-none border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold mb-4">Business Information</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Business Type</label>
            <select
              name="businessType"
              value={form.businessType}
              onChange={handleChange}
              className="w-full rounded px-3 py-2 mt-1 border border-gray-300 outline-none focus:ring-0"
            >
              <option value="individual">Individual</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">Business Registration Number</label>
            <input
              type="text"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded px-3 py-2 mt-1 border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-0"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Tax Information</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium">Tax ID / EIN</label>
            <input
              type="text"
              name="taxId"
              value={form.taxId}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded px-3 py-2 mt-1 border border-gray-300 placeholder:text-gray-400 outline-none focus:ring-0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for tax reporting purposes
            </p>
          </div>
        </div>
      </div>

      <div className="text-right">
        <button 
          type="submit"
          disabled={saving}
          className={`px-6 py-2 text-white rounded text-sm ${
            saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[var(--color-theme)] hover:opacity-90 cursor-pointer'
          }`}
        >
          {saving ? 'Updating...' : 'Update Store Info'}
        </button>
      </div>
    </form>
  );
}
