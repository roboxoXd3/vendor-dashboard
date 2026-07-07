import { useState } from "react";
import toast from "react-hot-toast";
import { getSupabase } from "@/lib/supabase";

import { FaEye, FaEyeSlash, FaKey, FaLock } from "react-icons/fa6";

// Was previously entirely fake: it checked the "current password" against a
// hardcoded mock string and, on "success", only updated local React state —
// no API call was ever made, so a vendor's real account password was never
// changed despite the "✅ Password updated successfully" message. Now
// verifies the current password via a real Supabase sign-in and updates it
// via supabase.auth.updateUser().
export default function ChangePasswordForm({ userEmail, onNewPasswordChange }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const toggleShow = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "newPassword") {
      onNewPasswordChange?.(value);
    }
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

  const handleSubmit = async () => {
    if (!userEmail) {
      toast.error("Unable to verify account — please refresh and try again.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabase();

      // Supabase has no standalone "verify current password" call — the
      // established pattern is to re-authenticate with it.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: form.currentPassword,
      });
      if (verifyError) {
        toast.error("Incorrect current password");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: form.newPassword,
      });
      if (updateError) {
        toast.error(updateError.message || "Failed to update password");
        return;
      }

      toast.success("Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onNewPasswordChange?.("");
    } catch (error) {
      toast.error(error?.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
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
                onChange={(e) => updateField("currentPassword", e.target.value)}
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
                onChange={(e) => updateField("newPassword", e.target.value)}
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
                onChange={(e) => updateField("confirmPassword", e.target.value)}
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
            disabled={!isFormValid || submitting}
            className={`flex items-center gap-2 justify-center mt-4 w-full text-white font-medium py-2 rounded transition-all duration-200
              ${
                isFormValid && !submitting
                  ? "bg-[var(--color-theme)] hover:opacity-90 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            <FaLock /> {submitting ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
