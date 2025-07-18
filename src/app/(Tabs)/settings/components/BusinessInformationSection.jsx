import React from "react";

export default function BusinessInformationSection() {
  return (
    <div>
      <div>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          🏢 Business Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Business Name</label>
            <input
              className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
              placeholder="TechGear Shop LLC"
            />
            <p className="text-xs text-gray-500 mt-1">
              Legal name as registered with authorities
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Business Type<span className="text-red-500">*</span>
            </label>
            <select className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0">
              <option>Select business type</option>
              <option>LLC</option>
              <option>Partnership</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Business Registration Number
            </label>
            <input
              className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
              placeholder="LLC-2023-789456"
            />
            <p className="text-xs text-gray-500 mt-1">
              Certificate of incorporation number or equivalent
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Tax/GST/VAT ID</label>
            <input
              className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
              placeholder="TAX-987654321"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your tax identification number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Country of Operation<span className="text-red-500">*</span>
            </label>
            <select className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0">
              <option>Select country</option>
              <option>India</option>
              <option>USA</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
