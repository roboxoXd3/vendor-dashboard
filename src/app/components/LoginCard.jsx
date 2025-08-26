"use client";
import { useState } from "react";
import { Mail, Phone, Eye, EyeOff, User, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState("login");
  const [method, setMethod] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: true
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    businessName: "",
    businessType: "individual",
    phone: "",
    agreeToTerms: false
  });
  
  const router = useRouter();
  const { signInWithToken } = useAuth();

  const businessTypes = [
    { value: 'individual', label: 'Individual/Sole Proprietorship' },
    { value: 'company', label: 'Company/Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llc', label: 'LLC (Limited Liability Company)' }
  ];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (method === "phone") {
      setLocalError("Phone login is not yet implemented. Please use email login.");
      return;
    }

    if (!loginData.email || !loginData.password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setLocalError("");
    setSuccessMessage("");

    try {
      console.log("🔄 Attempting login for:", loginData.email);
      const result = await signInWithToken(loginData.email, loginData.password);
      
      if (result.success && !result.requiresApproval && !result.requiresApplication) {
        console.log("✅ Login successful, redirecting...");
        setSuccessMessage("Login successful! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else if (result.requiresApproval) {
        console.log("⚠️ Vendor requires approval, redirecting to pending page");
        setSuccessMessage("Login successful! Redirecting to application status...");
        setTimeout(() => router.push("/vendor-pending"), 1000);
      } else if (result.requiresApplication) {
        console.log("ℹ️ User needs to complete vendor application");
        setSuccessMessage("Login successful! Please complete your vendor application...");
        setTimeout(() => router.push("/vendor-pending"), 1000);
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!registerData.email || !registerData.password || !registerData.fullName || !registerData.businessName) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (registerData.password.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    if (!registerData.agreeToTerms) {
      setLocalError("Please agree to the terms and conditions.");
      return;
    }

    setLoading(true);
    setLocalError("");
    setSuccessMessage("");

    try {
      console.log("🔄 Creating new vendor account for:", registerData.email);
      
      // Create user account with Supabase Auth
      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            business_name: registerData.businessName,
            business_type: registerData.businessType,
            phone: registerData.phone
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        console.log("✅ User account created successfully");
        setSuccessMessage("Account created successfully! Please check your email to verify your account, then you can login.");
        
        // Reset form
        setRegisterData({
          email: "",
          password: "",
          confirmPassword: "",
          fullName: "",
          businessName: "",
          businessType: "individual",
          phone: "",
          agreeToTerms: false
        });
        
        // Switch to login tab after 3 seconds
        setTimeout(() => {
          setActiveTab("login");
          setLoginData(prev => ({ ...prev, email: registerData.email }));
        }, 3000);
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      setLocalError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md w-full max-w-md">
      {/* Tab Switch: Login / Register */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("login");
            setLocalError("");
            setSuccessMessage("");
          }}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === "login"
              ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setActiveTab("register");
            setLocalError("");
            setSuccessMessage("");
          }}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === "register"
              ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === "login" ? "Welcome Back" : "Join Be Smart Mall"}
          </h2>
          <p className="text-gray-600 mt-1">
            {activeTab === "login"
              ? "Sign in to your vendor account"
              : "Start selling with us today"}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm font-medium flex items-center">
              <span className="mr-2">✅</span>
              {successMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {localError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium flex items-center">
              <span className="mr-2">❌</span>
              {localError}
            </p>
          </div>
        )}

        {/* Login Method Toggle */}
        {activeTab === "login" && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                method === "email"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Mail size={16} />
              Email
            </button>
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                method === "phone"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Phone size={16} />
              Phone
            </button>
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {method === "email" ? "Email Address" : "Phone Number"}
              </label>
              <div className="relative">
                <input
                  type={method === "email" ? "email" : "tel"}
                  value={method === "email" ? loginData.email : ""}
                  onChange={(e) => method === "email" && setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={method === "email" ? "vendor@example.com" : "+1 (555) 123-4567"}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {method === "email" ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        )}

        {/* Registration Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    disabled={loading}
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={registerData.businessName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your Business Name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    disabled={loading}
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={registerData.businessType}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, businessType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                  required
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="vendor@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    disabled={loading}
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a strong password"
                    className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={registerData.agreeToTerms}
                onChange={(e) => setRegisterData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
                required
              />
              <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-600">
                I agree to the{" "}
                <button type="button" className="text-emerald-600 hover:text-emerald-500 font-medium">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="text-emerald-600 hover:text-emerald-500 font-medium">
                  Privacy Policy
                </button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        )}

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Sign up here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Sign in here
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}