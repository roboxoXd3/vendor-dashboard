import { useState } from "react";

import { FaEye, FaEyeSlash, FaKey, FaLock } from "react-icons/fa6";

export default function ChangePasswordForm({
  savedPassword,
  onPasswordChange,
}) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const toggleShow = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const isLengthValid = form.newPassword.length >= 8;
  const hasNumber = /\d/.test(form.newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword);
  const passwordsMatch = form.newPassword === form.confirmPassword;

  const isFormValid =
    form.currentPassword &&
    isLengthValid &&
    hasNumber &&
    hasSpecialChar &&
    passwordsMatch;

  const handleSubmit = () => {
    if (form.currentPassword !== savedPassword) {
      alert("❌ Incorrect current password");
      return;
    }
    if (!passwordsMatch) {
      alert("❌ Passwords do not match");
      return;
    }

    onPasswordChange(form.newPassword);

    alert("✅ Password updated successfully");

    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div>
      <div className="border-1 border-gray-300 bg-gray-100 rounded-lg p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-base mb-4">
          <FaKey className="text-[var(--color-theme)]" /> Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Current Password<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={show.current ? "text" : "password"}
                value={form.currentPassword}
                onChange={(e) =>
                  setForm({ ...form, currentPassword: e.target.value })
                }
                className="w-full bg-white rounded px-3 py-2 mt-1 pr-10 border-1 border-gray-300 outline-0 focus:ring-0"
                placeholder="Enter current password"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                onClick={() => toggleShow("current")}
              >
                {show.current ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required to verify your identity
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">
              New Password<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={show.new ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
                className="w-full bg-white rounded px-3 py-2 mt-1 pr-10 border-1 border-gray-300 outline-0 focus:ring-0"
                placeholder="Enter new password"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                onClick={() => toggleShow("new")}
              >
                {show.new ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="text-xs mt-1 text-gray-500 flex flex-wrap gap-x-2">
              <span
                className={isLengthValid ? "text-green-600" : "text-gray-600"}
              >
                {isLengthValid ? "✔" : "✖"} 8+ characters
              </span>
              <span className={hasNumber ? "text-green-600" : "text-gray-600"}>
                {hasNumber ? "✔" : "✖"} 1 number
              </span>
              <span
                className={hasSpecialChar ? "text-green-600" : "text-gray-600"}
              >
                {hasSpecialChar ? "✔" : "✖"} 1 special character
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Confirm New Password<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={show.confirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className="w-full bg-white rounded px-3 py-2 mt-1 pr-10 border-1 border-gray-300 outline-0 focus:ring-0"
                placeholder="Re-enter new password"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                onClick={() => toggleShow("confirm")}
              >
                {show.confirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {!passwordsMatch && form.confirmPassword.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                ❌ Passwords do not match
              </p>
            )}
            {passwordsMatch && form.confirmPassword.length > 0 && (
              <p className="text-xs text-green-600 mt-1">✔ Passwords match</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`flex items-center gap-2 justify-center mt-4 w-full text-white font-medium py-2 rounded transition-all duration-200 
              ${
                isFormValid
                  ? "bg-[var(--color-theme)] hover:opacity-90 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            <FaLock /> Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
