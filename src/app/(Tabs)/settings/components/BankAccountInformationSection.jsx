import { useState } from "react";
import { FaUniversity, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdOutlinePhoneAndroid } from "react-icons/md";

export default function BankAccountInformationSection() {
  const [form, setForm] = useState({
    name: "",
    bankName: "",
    accountNumber: "",
    confirmAccount: "",
    ifsc: "",
    country: "",
    upiId: "",
    useUpi: true,
  });

  const [showAccount, setShowAccount] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div>
      <div className="col-span-2 bg-white rounded-lg space-y-4">
        <h3 className="flex items-center gap-2 text-base font-semibold mb-2">
          <FaUniversity className="text-[var(--color-theme)]" /> Bank Account
          Information
        </h3>

        {/* Account Holder Name */}
        <div>
          <label className="block text-sm font-medium">
            Account Holder Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
            placeholder="Enter your name"
          />
          <p className="text-xs text-gray-500 mt-1">
            Name as it appears on your bank account
          </p>
        </div>

        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium">
            Bank Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
            placeholder="Enter your bank name"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium">
            Account Number<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showAccount ? "text" : "password"}
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
              placeholder="Enter account number"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowAccount((prev) => !prev)}
            >
              {showAccount ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your account number will be securely encrypted
          </p>
        </div>

        {/* Confirm Account */}
        <div>
          <label className="block text-sm font-medium">
            Confirm Account Number<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="confirmAccount"
            value={form.confirmAccount}
            onChange={handleChange}
            className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
            placeholder="Re-enter account number"
          />
          <p className="text-xs text-gray-500 mt-1">
            Must match the account number above
          </p>
        </div>

        {/* IFSC */}
        <div>
          <label className="block text-sm font-medium">
            IFSC/SWIFT Code<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="ifsc"
            value={form.ifsc}
            onChange={handleChange}
            className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
            placeholder="Enter code"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bank routing code for international transfers
          </p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium">
            Country<span className="text-red-500">*</span>
          </label>
          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
          >
            <option value="">Select country</option>
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
          </select>
        </div>

        {/* UPI Details */}
        <div className="mt-6">
          <h4 className="flex items-center gap-1 font-semibold text-sm mb-4">
            <MdOutlinePhoneAndroid className="text-[var(--color-theme)]" /> UPI
            Details (Optional)
          </h4>
          <label className="block text-sm font-medium">UPI ID</label>
          <input
            type="text"
            name="upiId"
            value={form.upiId}
            onChange={handleChange}
            className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
            placeholder="yourname@upi"
          />
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              name="useUpi"
              checked={form.useUpi}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm">Use UPI as primary payout method</label>
          </div>
        </div>
      </div>
    </div>
  );
}
