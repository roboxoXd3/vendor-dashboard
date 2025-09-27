"use client";
import { useState, useEffect } from "react";
import { FaUniversity, FaPlus, FaCheck, FaClock, FaTimes } from "react-icons/fa";
import { SiPaypal } from "react-icons/si";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

export default function PayoutMethods() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const { formatPrice } = useCurrencyContext();
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: ''
  });

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

      // Refresh the list
      await fetchBankAccounts();
    } catch (err) {
      console.error('Error updating bank account:', err);
      alert('Failed to update bank account: ' + err.message);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    
    try {
      setAddingAccount(true);
      const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add bank account');
      }

      // Reset form and close modal
      setFormData({
        bank_name: '',
        bank_code: '',
        account_number: '',
        account_name: ''
      });
      setShowAddForm(false);
      
      // Refresh the list
      await fetchBankAccounts();
      
      alert('Bank account added successfully! It will be verified by admin.');
    } catch (err) {
      console.error('Error adding bank account:', err);
      alert('Failed to add bank account: ' + err.message);
    } finally {
      setAddingAccount(false);
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
          onClick={() => setShowAddForm(true)}
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
            onClick={() => setShowAddForm(true)}
            className="mt-2 text-[var(--color-theme)] text-sm hover:underline"
          >
            Add your first bank account
          </button>
        </div>
      ) : (
        bankAccounts.map((account) => (
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
            </div>
          </div>
        ))
      )}

      {/* Add Bank Account Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Bank Account</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.bank_code}
                  onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 011"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={addingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAccount}
                  className="flex-1 px-4 py-2 text-white bg-[var(--color-theme)] rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {addingAccount ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
