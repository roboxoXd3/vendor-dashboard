"use client";
import { useState, useEffect } from "react";
import BankAccountInformationSection from "./BankAccountInformationSection";
import { FaCircleInfo } from "react-icons/fa6";
import {
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaLock,
  FaUniversity,
} from "react-icons/fa";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

export default function PayoutDetailsPage() {
  const { formatPrice } = useCurrencyContext();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultAccount, setDefaultAccount] = useState(null);
  
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bank-accounts');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bank accounts');
      }

      const accounts = result.data || [];
      setBankAccounts(accounts);
      
      // Find default account
      const defaultAcc = accounts.find(acc => acc.is_default) || accounts[0] || null;
      setDefaultAccount(defaultAcc);
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for updates from BankAccountInformationSection
  useEffect(() => {
    const handleAccountUpdate = () => {
      fetchBankAccounts();
    };

    // Custom event listener for account updates
    window.addEventListener('bankAccountUpdated', handleAccountUpdate);
    return () => {
      window.removeEventListener('bankAccountUpdated', handleAccountUpdate);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = () => {
    if (!defaultAccount) {
      return (
        <span className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 text-sm rounded-full">
          <FaClock /> No Account
        </span>
      );
    }
    
    if (defaultAccount.is_verified) {
      return (
        <span className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 text-sm rounded-full">
          <FaCheckCircle /> Verified
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 text-sm rounded-full">
          <FaClock /> Pending Verification
        </span>
      );
    }
  };
  
  return (
    <div className="max-w-screen mx-auto bg-white shadow-md p-4 md:p-6 rounded-lg space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">Payout Details</h2>
          <p className="text-sm text-gray-500">
            Manage your payment receiving information for escrow releases and
            payouts
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5 border-b border-gray-300">
        {/* Left Form */}
        <div className="md:col-span-2 space-y-4">
          <BankAccountInformationSection />
        </div>

        {/* Right Status */}
        <div className="space-y-4">
          <div className="p-6 flex flex-col gap-2 rounded-lg border bg-[var(--color-theme-light)] border-[var(--color-theme)]">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FaCircleInfo className="text-[var(--color-theme)]" /> Current
              Setup
            </h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : defaultAccount ? (
              <>
                <div>
                  <span className="text-gray-500 text-[12px]">Payout Method</span>
                  <br />
                  <span className="flex items-center gap-2 text-[14px]">
                    <FaUniversity className="text-[var(--color-theme)]" />{" "}
                    Bank Transfer
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[12px]">Bank Name</span>
                  <br />
                  <span className="text-black text-[14px] font-normal">
                    {defaultAccount.bank_name || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[12px]">Account Number</span>
                  <br />
                  <span className="text-black text-[14px] font-normal">
                    **** **** **** {defaultAccount.account_number?.slice(-4) || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[12px]">Status</span>
                  <br />
                  <span className="flex items-center gap-2 text-[14px] text-[var(--color-theme)]">
                    <FaCheckCircle /> {defaultAccount.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-[12px]">Last Updated</span>
                  <br />
                  <span className="text-black text-[14px] font-normal">
                    {formatDate(defaultAccount.updated_at || defaultAccount.created_at)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FaUniversity className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm">No bank account added yet</p>
                <p className="text-xs mt-1">Add a bank account to start receiving payouts</p>
              </div>
            )}
          </div>

          {/* Notice */}
          <div className="bg-blue-50 p-4 border border-blue-200 text-sm rounded-lg">
            <h4 className="flex items-center gap-2 font-semibold mb-1 text-blue-700 text-[14px]">
              <FaShieldAlt className="pt-2 min-h-10" /> Security Notice
            </h4>
            <p className="text-blue-600 pl-5 text-[12px]">
              Your payment information is encrypted and securely stored. Changes
              may require verification and could delay next payout.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex flex-wrap justify-between items-center gap-4 mt-6">
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <FaLock /> All payment information is encrypted and stored securely
        </p>
      </div>
    </div>
  );
}
