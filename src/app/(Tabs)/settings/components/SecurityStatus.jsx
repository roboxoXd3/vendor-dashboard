import { useEffect, useState } from "react";
import { FaCircleXmark } from "react-icons/fa6";

// `password` is the live value of the "New Password" field being typed in
// ChangePasswordForm — this shows a live strength meter for it, not a
// persisted/saved credential.
export default function SecurityStatus({ password = "" }) {
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState("Very Weak");

  useEffect(() => {
    let score = 0;
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);

    if (hasLength) score += 2;
    if (hasNumber) score += 2;
    if (hasSpecialChar) score += 2;
    if (hasUpper && hasLower) score += 2;
    if (password.length >= 12) score += 2;

    setPasswordScore(score);

    if (score <= 2) setPasswordStrength("Very Weak");
    else if (score <= 4) setPasswordStrength("Weak");
    else if (score <= 6) setPasswordStrength("Moderate");
    else if (score <= 8) setPasswordStrength("Strong");
    else setPasswordStrength("Very Strong");
  }, [password]);

  const getColor = () => {
    if (passwordScore <= 2) return "bg-red-600 text-red-700";
    if (passwordScore <= 4) return "bg-yellow-500 text-yellow-700";
    if (passwordScore <= 6) return "bg-orange-500 text-orange-700";
    if (passwordScore <= 8) return "bg-green-600 text-green-700";
    return "bg-emerald-700 text-emerald-800";
  };

  return (
    <div
      className={`p-6 rounded-lg space-y-2 border-1 bg-[var(--color-theme-light)] border-[var(--color-theme)]`}
    >
      <h3 className="font-semibold text-sm mb-4">🛡️ Security Status</h3>
      <div className="text-sm">
        <p className="mb-1 text-gray-500">New Password Strength</p>
        {password ? (
          <div className="flex items-center gap-2">
            <div className="w-full h-2 bg-gray-200 rounded">
              <div
                className={`h-2 rounded transition-all duration-300 ${getColor()}`}
                style={{ width: `${(passwordScore / 10) * 100}%` }}
              ></div>
            </div>
            <span className={`font-medium ${getColor().split(" ")[1]}`}>
              {passwordStrength}
            </span>
          </div>
        ) : (
          <p className="text-gray-400 text-xs">
            Start typing a new password to see its strength
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <p className="text-sm text-gray-500">Two-Factor Authentication</p>
        <p className="flex items-center gap-2 text-yellow-600 font-semibold">
          <FaCircleXmark /> Not Enabled
        </p>
      </div>
    </div>
  );
}
