"use client";
import { useState } from "react";
import { Mail, Phone } from "lucide-react";

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState("login");
  const [method, setMethod] = useState("email");

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

        {/* Form */}
        <form className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {method === "email" ? "Email Address" : "Phone Number"}
            </label>
            <input
              type={method === "email" ? "email" : "tel"}
              placeholder={
                method === "email" ? "your@email.com" : "+91 9876543210"
              }
              className="w-full px-6 py-2 border-1 border-gray-300 rounded-lg focus:outline-none"
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
              placeholder="••••••••"
              className="w-full px-6 py-2 border-1 border-gray-300 rounded-lg focus:outline-none"
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
            <div className="text-right">
              <a
                href="#"
                className="text-sm font-medium text-[var(--color-theme)] hover:underline"
              >
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--color-theme)] text-white py-2 rounded-md font-semibold cursor-pointer"
          >
            {activeTab === "login" ? "Sign In" : "Register"}
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
