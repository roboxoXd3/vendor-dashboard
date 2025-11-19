"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUniversity, FaPlus, FaCheck, FaClock, FaTrash, FaEye } from "react-icons/fa";
import { SiPaypal } from "react-icons/si";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import toast from "react-hot-toast";

export default function PayoutMethods() {
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const { formatPrice } = useCurrencyContext();

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

      setBankAccounts(result.data);
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDefault = async (accountId) => {
    try {
      const loadingToast = toast.loading('Updating bank account...');
      
      const response = await fetch(`/api/bank-accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_default: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update bank account');
      }

      toast.dismiss(loadingToast);
      toast.success('Bank account set as default successfully');

      // Refresh the list
      await fetchBankAccounts();
    } catch (err) {
      console.error('Error updating bank account:', err);
      toast.error('Failed to update bank account: ' + err.message);
    }
  };

  const handleAddNew = () => {
    // Redirect to settings page with Payout Details tab
    router.push('/settings?tab=Payout Details');
  };

  const handleViewAll = () => {
    // Redirect to settings page with Payout Details tab
    router.push('/settings?tab=Payout Details');
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingAccountId(accountId);
      const loadingToast = toast.loading('Deleting bank account...');
      
      const response = await fetch(`/api/bank-accounts/${accountId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete bank account');
      }

      toast.dismiss(loadingToast);
      toast.success('Bank account deleted successfully');

      // Refresh the list
      await fetchBankAccounts();
    } catch (err) {
      console.error('Error deleting bank account:', err);
      toast.error('Failed to delete bank account: ' + err.message);
    } finally {
      setDeletingAccountId(null);
    }
  };

  const getStatusBadge = (account) => {
    if (account.is_verified) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
          <FaCheck size={10} />
          Verified
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
          <FaClock size={10} />
          Pending Verification
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-5 w-full h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Payout Methods</h2>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded border border-gray-300 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-5 w-full h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Payout Methods</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <p className="font-medium">Error loading bank accounts</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchBankAccounts}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 w-full h-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Payout Methods</h2>
        <button 
          onClick={handleAddNew}
          className="text-[var(--color-theme)] text-sm hover:underline focus:outline-none flex items-center gap-1"
        >
          <FaPlus size={12} />
          Add New
        </button>
      </div>

      {bankAccounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaUniversity className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-sm">No bank accounts added yet</p>
          <button
            onClick={handleAddNew}
            className="mt-2 text-[var(--color-theme)] text-sm hover:underline"
          >
            Add your first bank account
          </button>
        </div>
      ) : (
        <>
          {bankAccounts.slice(0, 1).map((account) => (
            <div
              key={account.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded border mb-3 gap-3 
                ${
                  account.is_default
                    ? "bg-[var(--color-theme-light)] border-gray-300"
                    : "border-gray-300"
                }`}
            >
              <div className="flex items-center gap-3">
                <FaUniversity className="text-gray-700" size={20} />
                <div className="flex flex-col">
                  <span className="text-md font-semibold">{account.bank_name}</span>
                  <span className="text-sm text-gray-500">
                    **** **** **** {account.account_number.slice(-4)}
                  </span>
                  <span className="text-xs text-gray-400">{account.account_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(account)}
                
                {account.is_default ? (
                  <span className="bg-[var(--color-theme)] text-xs text-white px-3 py-1 rounded-xl">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleMakeDefault(account.id)}
                    className="text-xs text-[var(--color-theme)] hover:underline focus:outline-none"
                    disabled={!account.is_verified}
                    title={!account.is_verified ? "Account must be verified to set as default" : ""}
                  >
                    Make Default
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  disabled={deletingAccountId === account.id || account.is_default}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title={account.is_default ? "Cannot delete default account" : "Delete account"}
                >
                  <FaTrash size={10} />
                  {deletingAccountId === account.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
          
          {bankAccounts.length > 2 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleViewAll}
                className="w-full text-[var(--color-theme)] text-sm hover:underline focus:outline-none flex items-center justify-center gap-2 py-2"
              >
                <FaEye size={14} />
                View All ({bankAccounts.length} accounts)
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-500 mt-4 leading-relaxed">
        Withdrawal minimum: {formatPrice(50, 'USD')}
        <br />
        Processing time: 1–3 business days
        <br />
        <span className="text-yellow-600">Note: Bank accounts must be verified by admin before use.</span>
      </p>
    </div>
  );
}
