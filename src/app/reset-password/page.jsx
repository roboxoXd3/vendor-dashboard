"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import toast from "react-hot-toast";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    // Fix duplicate path issue: if URL has /reset-password/reset-password, redirect to /reset-password
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath === '/reset-password/reset-password' || currentPath.startsWith('/reset-password/reset-password')) {
        const searchParams = window.location.search;
        window.location.replace(`/reset-password${searchParams}`);
        return;
      }
    }
    
    // Handle password reset tokens from URL
    const handlePasswordReset = async () => {
      try {
        const supabase = getSupabase();
        
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 Hash:', window.location.hash);
        console.log('🔍 Search:', window.location.search);
        
        // Check for tokens in URL hash (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        let access_token = hashParams.get('access_token');
        let refresh_token = hashParams.get('refresh_token');
        let type = hashParams.get('type');
        
        // If not in hash, check query parameters (PKCE flow)
        if (!access_token) {
          const searchParams = new URLSearchParams(window.location.search);
          access_token = searchParams.get('access_token');
          refresh_token = searchParams.get('refresh_token');
          type = searchParams.get('type');
          
          // Check for different PKCE flow parameters
          const token_hash = searchParams.get('token_hash');
          const code = searchParams.get('code');
          
          if (token_hash && !access_token) {
            console.log('🔍 Found token_hash, attempting PKCE verification...');
            
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash,
              type: 'recovery'
            });
            
            if (error) {
              console.error('❌ Error verifying OTP:', error);
              setError("Invalid or expired reset link. Please request a new password reset.");
              return;
            }
            
            console.log('✅ PKCE verification successful:', data.session?.user?.email);
            console.log('✅ Ready for password reset');
            setValidatingSession(false);
            return;
          }
          
          // Handle 'code' parameter (another PKCE flow variant)
          if (code && !access_token) {
            console.log('🔍 Found code parameter, attempting code exchange...');
            
            try {
              // Try to exchange the code for a session
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              
              if (error) {
                console.error('❌ Error exchanging code:', error);
                setError("Invalid or expired reset link. Please request a new password reset.");
                return;
              }
              
              console.log('✅ Code exchange successful:', data.session?.user?.email);
              console.log('✅ Ready for password reset');
              setValidatingSession(false);
              return;
            } catch (codeError) {
              console.error('❌ Code exchange failed:', codeError);
              
              // Fallback: try treating it as a recovery token
              try {
                console.log('🔄 Trying code as recovery token...');
                const { data, error } = await supabase.auth.verifyOtp({
                  token: code,
                  type: 'recovery'
                });
                
                if (error) {
                  console.error('❌ Error verifying code as OTP:', error);
                  setError("Invalid or expired reset link. Please request a new password reset.");
                  return;
                }
                
                console.log('✅ Code verification successful:', data.session?.user?.email);
                console.log('✅ Ready for password reset');
                setValidatingSession(false);
                return;
              } catch (otpError) {
                console.error('❌ All code verification methods failed:', otpError);
                setError("Invalid or expired reset link. Please request a new password reset.");
                return;
              }
            }
          }
        }
        
        const searchParams = new URLSearchParams(window.location.search);
        console.log('🔍 Token params:', { 
          access_token: !!access_token, 
          refresh_token: !!refresh_token, 
          type,
          code: searchParams.get('code'),
          token_hash: searchParams.get('token_hash'),
          source: access_token ? (window.location.hash ? 'hash' : 'search') : 'none'
        });
        
        if (access_token && refresh_token && type === 'recovery') {
          console.log('🔄 Setting session from URL tokens...');
          
          // Set the session using tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (error) {
            console.error('❌ Error setting session:', error);
            setError("Invalid or expired reset link. Please request a new password reset.");
            return;
          }
          
          console.log('✅ Session set successfully:', data.session?.user?.email);
          setValidatingSession(false);
        } else {
          // Check if we already have a valid session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.log('❌ No valid session or tokens found');
            console.log('🔍 Available URL params:');
            console.log('  - Hash params:', Object.fromEntries(hashParams));
            console.log('  - Search params:', Object.fromEntries(new URLSearchParams(window.location.search)));
            setError("Invalid or expired reset link. Please request a new password reset.");
            setValidatingSession(false);
            return;
          }
          
          console.log('✅ Existing session found:', session.user?.email);
          setValidatingSession(false);
        }
        
        console.log('✅ Ready for password reset');
      } catch (err) {
        console.error('❌ Error handling password reset:', err);
        setError("Unable to validate reset session. Please try again.");
      } finally {
        setValidatingSession(false);
      }
    };

    handlePasswordReset();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();
      
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      console.log("✅ Password updated successfully");
      toast.success("Password updated successfully! Redirecting to login...");
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (err) {
      console.error("❌ Password update error:", err);
      toast.error(err.message || "Failed to update password. Please try again.");
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (validatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset session...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h1>
          <p className="text-gray-600 mb-4">
            Your password has been successfully updated. You will be redirected to the login page shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium flex items-center">
                <span className="mr-2">❌</span>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 6 characters long</li>
                <li>Must match the confirmation password</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reset page...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
