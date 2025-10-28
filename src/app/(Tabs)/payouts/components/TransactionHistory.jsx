"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

export default function TransactionHistory() {
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const router = useRouter();
  const { formatPrice } = useCurrencyContext();

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, selectedType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const typeParam = selectedType === "All" ? "all" : selectedType.toLowerCase();
      const url = `/api/transactions?page=${currentPage}&limit=${ITEMS_PER_PAGE}&type=${typeParam}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch transactions');
      }

      setTransactions(result.data.transactions);
      setPagination(result.data.pagination);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = pagination?.pages || 0;
  const currentItems = transactions;

  // Helper function to format transaction amounts with proper currency
  const formatTransactionAmount = (amount, currency = null) => {
    const numericAmount = parseFloat(amount);
    const transactionCurrency = currency || 'USD';
    
    if (numericAmount < 0) {
      return `-${formatPrice(Math.abs(numericAmount), transactionCurrency)}`;
    } else {
      return `+${formatPrice(numericAmount, transactionCurrency)}`;
    }
  };

  function handlePrevious() {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }

  function handleNext() {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }

  function handleFilterChange(e) {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  }

  const handleTransactionClick = (transaction) => {
    // Use the orderId from the API response if available
    if (transaction.orderId) {
      // Navigate to orders page with the order ID as a parameter to open the details panel
      router.push(`/orders?orderId=${transaction.orderId}`);
    } else {
      // For non-order transactions (like payouts), show a message or handle differently
      console.log('This transaction is not related to a specific order');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Transaction History</h2>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Transaction History</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <p className="font-medium">Error loading transactions</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchTransactions}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Transaction History
        </h2>
        <select
          value={selectedType}
          onChange={handleFilterChange}
          className="text-sm border border-gray-300 rounded px-3 py-2 bg-gray-100 outline-0 focus:ring-0 cursor-pointer"
        >
          <option value="All">All Transactions</option>
          <option value="Withdrawal">Withdrawal</option>
          <option value="Earning">Earning</option>
          <option value="Refund">Refund</option>
        </select>
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">
          No transactions to display.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-[600px] w-full text-sm text-left">
              <thead className="text-xs text-gray-500 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-3 py-3">Transaction ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((trx, i) => {
                  const isOrderRelated = trx.orderId !== undefined;
                  return (
                    <tr 
                      key={i} 
                      className={`border-b border-[#E5E7EB] ${
                        isOrderRelated 
                          ? 'hover:bg-gray-50 cursor-pointer transition-colors' 
                          : ''
                      }`}
                      onClick={() => isOrderRelated && handleTransactionClick(trx)}
                      title={isOrderRelated ? 'Click to view order details' : ''}
                    >
                      <td className="p-3">#{trx.id}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            trx.type === "Withdrawal"
                              ? "bg-blue-100 text-blue-700"
                              : trx.type === "Earning"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {trx.type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{trx.description}</td>
                      <td className="py-3 text-gray-500">{trx.date}</td>
                      <td
                        className={`py-3 font-semibold ${
                          trx.amount < 0 ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {formatTransactionAmount(trx.amount, trx.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {currentItems.map((trx, i) => {
              const isOrderRelated = trx.orderId !== undefined;
              return (
                <div
                  key={i}
                  className={`border border-[#E5E7EB] rounded-lg p-4 shadow-sm bg-white ${
                    isOrderRelated 
                      ? 'hover:bg-gray-50 cursor-pointer transition-colors' 
                      : ''
                  }`}
                  onClick={() => isOrderRelated && handleTransactionClick(trx)}
                >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold text-gray-600">
                    #{trx.id}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      trx.type === "Withdrawal"
                        ? "bg-blue-100 text-blue-700"
                        : trx.type === "Earning"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {trx.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <strong className="text-black">Desc:</strong>{" "}
                  {trx.description}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong className="text-black">Date:</strong> {trx.date}
                </p>
                <p
                  className={`text-sm font-normal ${
                    trx.amount < 0 ? "text-red-500" : "text-green-600"
                  }`}
                >
                  <span>
                    <strong className="text-black">Amount: </strong>
                    <strong>
                      {formatTransactionAmount(trx.amount, trx.currency)}
                    </strong>
                  </span>
                </p>
              </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="text-xs text-gray-500 mt-4 flex flex-wrap items-center justify-between gap-3">
        <span>
          {pagination?.total === 0
            ? "No transactions found"
            : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(
                currentPage * ITEMS_PER_PAGE,
                pagination?.total || 0
              )} of ${pagination?.total || 0} transactions`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm ${
              currentPage === totalPages || totalPages === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
