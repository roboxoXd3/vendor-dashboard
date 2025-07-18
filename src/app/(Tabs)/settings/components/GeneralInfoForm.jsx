"use client";

import { useState } from "react";
import { FaImage } from "react-icons/fa";

export default function GeneralInfo() {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    email: "mike@techgearshop.com",
    phone: "",
    address: "",
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-screen mx-auto bg-white p-4 md:p-6 rounded-lg shadow space-y-6">
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

      <div className="text-right">
        <button className="px-6 py-2 text-white rounded text-sm cursor-pointer bg-[var(--color-theme)]">
          Update Store Info
        </button>
      </div>
    </div>
  );
}
