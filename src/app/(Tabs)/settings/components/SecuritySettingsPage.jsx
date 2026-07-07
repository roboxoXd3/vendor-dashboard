"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ChangePasswordForm from "./ChangePasswordForm";
import SecurityStatus from "./SecurityStatus";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  // Live value of the "New Password" field, lifted here so the strength
  // meter on the right reflects what the vendor is actually typing.
  const [newPasswordDraft, setNewPasswordDraft] = useState("");

  return (
    <div className="mx-auto max-w-screen bg-white p-4 md:p-6 rounded-lg shadow space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Security Settings</h2>
        </div>
        <p className="text-gray-500 text-sm">
          Manage your account security and login credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Form + 2FA */}
        <div className="lg:col-span-2 space-y-6">
          <ChangePasswordForm
            userEmail={user?.email}
            onNewPasswordChange={setNewPasswordDraft}
          />

          {/* Two-Factor Authentication */}
          <div className="border border-blue-200 bg-blue-50 p-6 rounded-lg">
            <div className="flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  📱 Two-Factor Authentication
                </h3>
                <span className="text-sm text-gray-500">Disabled</span>
              </div>
              <p className="text-sm mt-2 text-gray-500">
                Add an extra layer of security to your account with SMS or
                app-based authentication.
              </p>
              <div className="flex justify-center mt-4">
                <button
                  className="px-4 py-1 text-sm bg-yellow-200 text-yellow-800 rounded-full font-medium"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Security Status + Recent Activity */}
        <div className="space-y-6">
          {/* 🛡️ Security Status */}
          <SecurityStatus password={newPasswordDraft} />

          {/* Recent Activity */}
          <div className="border border-gray-300 bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-sm mb-3">🔁 Recent Activity</h3>
            <p className="text-sm text-gray-500">
              Login history isn't tracked yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
