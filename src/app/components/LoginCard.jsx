"use client";
import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState("login");
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  
  const router = useRouter();
  const { signInWithToken, error: authError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === "register") {
      // For now, just show a message about registration
      setLocalError("Registration is not yet implemented. Please use existing vendor credentials.");
      return;
    }

    if (method === "phone") {
      setLocalError("Phone login is not yet implemented. Please use email login.");
      return;
    }

    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setLocalError("");

    try {
      console.log("🔄 Attempting token-based login for:", email);
      const result = await signInWithToken(email, password);
      
      if (result.success) {
        console.log("✅ Login successful, redirecting...");
        router.push("/dashboard");
      } else if (result.requiresApproval) {
        console.log("⚠️ Vendor requires approval, redirecting to pending page");
        router.push("/vendor-pending");
      } else {
        console.error("❌ Login failed:", result.error);
        setLocalError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("❌ Login exception:", err);
      setLocalError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md w-full max-w-sm">
      {/* Tab Switch: Login / Register */}
      <div className="flex border-b-1 border-gray-200">
        <button
          className={`flex-1 py-3 text-sm rounded-tl-xl font-medium cursor-pointer ${
            activeTab === "login"
              ? "text-[var(--color-theme)] border-b-2 border-[var(--color-theme)] bg-[var(--color-theme-light)]"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("login")}
        >
          Login
        </button>
        <button
          className={`flex-1 py-3 text-sm rounded-tr-xl font-medium cursor-pointer ${
            activeTab === "register"
              ? "text-[var(--color-theme)] border-b-2 border-[var(--color-theme)] bg-[var(--color-theme-light)]"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("register")}
        >
          Register
        </button>
      </div>

      <div className="px-6 pb-6 pt-4">
        {/* Header */}
        <h2 className="text-xl font-bold text-center">
          {activeTab === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          {activeTab === "login"
            ? "Sign in to your vendor account"
            : "Join as a vendor to start selling"}
        </p>

        {/* Method Toggle (Email / Phone) */}
        <div className="flex bg-gray-100 rounded-lg mt-6 overflow-hidden text-sm font-medium p-1">
          <button
            className={`w-1/2 py-2 flex items-center justify-center rounded-lg cursor-pointer gap-1 ${
              method === "email"
                ? "bg-white shadow text-black"
                : "text-gray-500"
            }`}
            onClick={() => setMethod("email")}
          >
            <Mail size={16} />
            Email
          </button>
          <button
            className={`w-1/2 py-2 flex items-center justify-center rounded-lg cursor-pointer gap-1 ${
              method === "phone"
                ? "bg-white shadow text-black"
                : "text-gray-500"
            }`}
            onClick={() => setMethod("phone")}
          >
            <Phone size={16} />
            Phone
          </button>
        </div>

        {/* Error Display */}
        {(localError || authError) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {localError || authError?.message}
            </p>
          </div>
        )}



        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">
              {method === "email" ? "Email Address" : "Phone Number"}
            </label>
            <input
              type={method === "email" ? "email" : "tel"}
              value={method === "email" ? email : ""}
              onChange={(e) => method === "email" && setEmail(e.target.value)}
              placeholder={
                method === "email" ? "admin@besmartmall.com" : "+91 9876543210"
              }
              className="w-full px-6 py-2 border-1 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loading}
              required={activeTab === "login"}
            />
          </div>

          {activeTab === "register" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-6 py-2 border-1 border-gray-300 rounded-lg focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-2 border-1 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loading}
              required={activeTab === "login"}
            />
          </div>

          {activeTab === "register" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-6 py-2 border-1 border-gray-300 rounded-lg focus:outline-none"
              />
            </div>
          )}

          {activeTab === "login" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-right">
                <a
                  href="#"
                  className="text-sm font-medium text-[var(--color-theme)] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-theme)] hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 rounded-md font-semibold transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing In...
              </>
            ) : (
              activeTab === "login" ? "Sign In" : "Register"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {activeTab === "login" ? (
            <>
              Don’t have an account?{" "}
              <button
                className="cursor-pointer text-[var(--color-theme)] font-semibold hover:underline"
                onClick={() => setActiveTab("register")}
              >
                Register now
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="cursor-pointer text-[var(--color-theme)] font-semibold hover:underline"
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
