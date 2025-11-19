"use client";
import { useState, useEffect } from "react";
import { FaUniversity, FaEye, FaEyeSlash, FaPlus, FaCheck, FaClock, FaTrash, FaTimes, FaSave } from "react-icons/fa";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import toast from "react-hot-toast";

export default function BankAccountInformationSection() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [showAccount, setShowAccount] = useState({});
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

      setBankAccounts(result.data || []);
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setFormData({
      bank_name: '',
      bank_code: '',
      account_number: '',
      account_name: ''
    });
    setShowAddForm(false);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.bank_name || !formData.bank_code || !formData.account_number || !formData.account_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.account_number.length < 8) {
      toast.error('Account number must be at least 8 digits');
      return;
    }
    
    try {
      setAddingAccount(true);
      const loadingToast = toast.loading('Adding bank account...');
      
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

      toast.dismiss(loadingToast);
      toast.success('Bank account added successfully! It will be verified by admin.');

      // Reset form and close form
      setFormData({
        bank_name: '',
        bank_code: '',
        account_number: '',
        account_name: ''
      });
      setShowAddForm(false);
      
      // Refresh the list
      await fetchBankAccounts();
      
      // Notify parent component
      window.dispatchEvent(new CustomEvent('bankAccountUpdated'));
    } catch (err) {
      console.error('Error adding bank account:', err);
      toast.error('Failed to add bank account: ' + err.message);
    } finally {
      setAddingAccount(false);
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
      
      // Notify parent component
      window.dispatchEvent(new CustomEvent('bankAccountUpdated'));
    } catch (err) {
      console.error('Error updating bank account:', err);
      toast.error('Failed to update bank account: ' + err.message);
    }
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
      
      // Notify parent component
      window.dispatchEvent(new CustomEvent('bankAccountUpdated'));
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

  const toggleShowAccount = (accountId) => {
    setShowAccount((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg space-y-4">
        <h3 className="flex items-center gap-2 text-base font-semibold mb-2">
          <FaUniversity className="text-[var(--color-theme)]" /> Bank Account
          Information
        </h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded border border-gray-300 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg space-y-4">
        <h3 className="flex items-center gap-2 text-base font-semibold mb-2">
          <FaUniversity className="text-[var(--color-theme)]" /> Bank Account
          Information
        </h3>
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
    <div className="bg-white rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <FaUniversity className="text-[var(--color-theme)]" /> Bank Account
          Information
        </h3>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="text-[var(--color-theme)] text-sm hover:underline focus:outline-none flex items-center gap-1"
          >
            <FaPlus size={12} />
            Add New
          </button>
        )}
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <div className="p-4 rounded-lg border border-gray-300 bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700">Add New Bank Account</h4>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={16} />
            </button>
          </div>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="bank_code"
                  value={formData.bank_code}
                  onChange={handleChange}
                  className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
                  placeholder="e.g. 011"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
                  placeholder="e.g. 1234567890"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your account number will be securely encrypted
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleChange}
                  className="w-full rounded px-3 py-2 mt-1 border-1 border-gray-300 placeholder:text-gray-400 outline-0 focus:ring-0"
                  placeholder="e.g. John Doe"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Name as it appears on your bank account
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-100"
                disabled={addingAccount}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingAccount}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--color-theme)] text-white cursor-pointer disabled:opacity-50"
              >
                <FaSave /> {addingAccount ? 'Adding...' : 'Save Bank Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {bankAccounts.length === 0 && !showAddForm ? (
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
      ) : bankAccounts.length > 0 ? (
        <div className="space-y-3">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded border gap-3 
                ${
                  account.is_default
                    ? "bg-[var(--color-theme-light)] border-gray-300"
                    : "border-gray-300"
                }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <FaUniversity className="text-gray-700" size={20} />
                <div className="flex flex-col">
                  <span className="text-md font-semibold">{account.bank_name}</span>
                  <span className="text-sm text-gray-500">
                    {showAccount[account.id] 
                      ? account.account_number 
                      : `**** **** **** ${account.account_number.slice(-4)}`}
                  </span>
                  <span className="text-xs text-gray-400">{account.account_name}</span>
                  <span className="text-xs text-gray-400">Bank Code: {account.bank_code}</span>
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
                  onClick={() => toggleShowAccount(account.id)}
                  className="text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
                  title={showAccount[account.id] ? "Hide account number" : "Show account number"}
                >
                  {showAccount[account.id] ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                </button>
                
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
        </div>
      ) : null}

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
